import {FunctionComponent, useState, useEffect} from "react";
import styles from '@/components/index.less'
import {
    Form, Input, Select, Row, Col, Button, Spin
} from 'antd'
import {projectsApi, subProjectsApi} from '@/apis/basic';
import {SelectSprint} from "@/components/myAntd";
import {get_init_project, get_init_sprint} from "@/utils/utils";
const SearchSection:FunctionComponent = (props: any) =>{
    const {onSubmit, allowClearProject} = props;
    const [currentProjectId, setCurrentProjectId] = useState(get_init_project());
    const [projects, setProjects] = useState([]);
    const [subProjects, setSubProjects] = useState([]);
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
    const getSubProjects = async (project_id)=>{
        const res:any = await subProjectsApi({
            project_id: project_id
        });
        if(res.success){
            setSubProjects(res.data.map((x:any)=>{
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
    useEffect(()=>{
        getSubProjects(currentProjectId);
    }, [currentProjectId])
    return (
        <div className={styles.searchSection}>
            <Form form={form}
            >
                <Spin spinning={loading}>
                    <Row>
                        <Col span={4}>
                            <Form.Item
                                label="项目"
                                name={"project_id"}
                                initialValue={currentProjectId}
                            >
                                <Select
                                    allowClear={!!allowClearProject}
                                    options={projects}
                                    style={{width: '90%'}}
                                    onChange={(value)=>{
                                        setCurrentProjectId(value);
                                        form.setFieldsValue({
                                            ...form.getFieldsValue(),
                                            project_id: value,
                                            sprint_id: null,
                                            sub_project_id: null
                                        });
                                        if(value){
                                            localStorage.setItem('project_id', value);
                                            localStorage.setItem('sprint_id', '');
                                            localStorage.setItem('sub_project_id', '');
                                        }
                                        else{
                                            localStorage.setItem('sprint_id', '');
                                            localStorage.setItem('sub_project_id', '');
                                        }
                                        onSubmit(form.getFieldsValue());
                                    }}

                                />
                            </Form.Item>
                        </Col>
                        {subProjects.length > 0 ?
                            (
                            <Col span={4}>
                                <Form.Item
                                    label="子项目"
                                    name={"sub_project_id"}
                                >
                                    <Select
                                        options={subProjects}
                                        style={{width: '90%'}}
                                        onChange={(value:any)=>{
                                            if(value){
                                                localStorage.setItem('sub_project_id', value);
                                            }
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                            ): null}
                        <Col span={4}>
                            <Form.Item
                                label="名称"
                                name={"name"}

                            >
                                <Input style={{width: '90%'}} />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Button onClick={handleSubmitForm}>查询</Button>
                        </Col>
                    </Row>
                </Spin>

            </Form>
        </div>

    )
}
export {SearchSection}