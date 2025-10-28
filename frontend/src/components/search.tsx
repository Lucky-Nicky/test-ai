import {FunctionComponent, useState, useEffect} from "react";
import styles from '@/components/index.less';
import {
    Form, Input, Select, Row, Col, Button, Spin
} from 'antd'
import {projectsApi} from '@/apis/basic';
import {SelectSprint} from "@/components/myAntd";
import {get_init_project, get_init_sprint} from "@/utils/utils";
const SearchSection:FunctionComponent = (props: any) =>{
    const {onSubmit, allowClearProject, sprintStatus} = props;
    const [currentProjectId, setCurrentProjectId] = useState(get_init_project());
    const [currentSprintId, setCurrentSprintId] = useState(get_init_sprint());
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
                    label="迭代"
                    name={"sprint_id"}
                    initialValue={currentSprintId}
                >
                    <SelectSprint
                        style={{width: 200}}
                        project_id={currentProjectId}
                        onChange={(value)=>{
                            localStorage.setItem('sprint_id', value || '');
                            onSubmit(form.getFieldsValue());
                        }}
                    />
                </Form.Item>
                {
                    sprintStatus ?
                        (
                            <Form.Item
                                label={"状态"}
                                name={"status"}
                                initialValue={0}
                            >
                                <Select
                                    style={{width: 200}}
                                    allowClear
                                    options={[
                                        {value: 0, label: '进行中'},
                                        {value: 1, label: '已完成'}
                                    ]}
                                />
                            </Form.Item>
                        ): null
                }

                <Button type={"primary"} onClick={handleSubmitForm}>查询</Button>

            </Form>
        </div>

    )
}
export {SearchSection}