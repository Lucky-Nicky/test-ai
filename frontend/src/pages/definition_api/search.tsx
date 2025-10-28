import {FunctionComponent, useState, useEffect} from "react";
import styles from '@/components/index.less';
import {
    Form, Input, Select, Row, Col, Button, Spin
} from 'antd'
import {projectsApi} from '@/apis/basic';
import {get_init_project} from "@/utils/utils";
import {SelectSprint} from "@/components/myAntd";
const SearchSection:FunctionComponent = (props: any) =>{
    const {onSubmit, allowClearProject} = props;
    const [currentProjectId, setCurrentProjectId] = useState(get_init_project());
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const getProjects = async ()=>{
      const res:any = await projectsApi();
      if(res.success){
          setProjects(res.data.map((x:any)=>{
              return {value: x.id, label: x.name}
          }));
      }
    };
    const handleSubmitForm = ()=>{
        form
            .validateFields()
            .then(async (values) => {
                setLoading(true);
                onSubmit(values);
                setLoading(false);
            })
            .catch((err) => {
                console.log(err);
                setLoading(false);
            });

    };
    useEffect(()=>{
        getProjects()
        onSubmit(form.getFieldsValue());
    }, []);
    return (
        <div className={styles.searchSection}>
            <Form form={form} layout={"inline"} disabled={loading}
            >
                <Form.Item
                    label="项目"
                    name={"project_id"}
                    initialValue={currentProjectId}
                >
                    <Select
                        style={{width: 200}}
                        allowClear={!!allowClearProject}
                        options={projects}
                        onChange={(value)=>{
                            setCurrentProjectId(value);
                            form.setFieldsValue({
                                project_id: value,
                                sprint_id: ''
                            });
                            if(value){
                                localStorage.setItem('project_id', value);
                                localStorage.setItem('sprint_id', '');
                            }
                            else{
                                localStorage.setItem('sprint_id', '');
                            }
                            onSubmit(form.getFieldsValue());
                        }}

                    />
                </Form.Item>
                <Form.Item
                    label="名称"
                    name={"name"}
                >
                    <Input />
                </Form.Item>
                <Button type={"primary"} onClick={handleSubmitForm}>查询</Button>

            </Form>
        </div>

    )
}
export {SearchSection}