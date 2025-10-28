import {FunctionComponent, useState, useEffect} from "react";
import styles from '@/components/index.less'
import {
    Form, Input, Select, Row, Col, Button, Spin
} from 'antd'
import {projectsApi} from '@/apis/basic';
import {SelectSprint} from "@/components/myAntd";
import {get_init_project, get_init_sprint} from "@/utils/utils";
const SearchSection:FunctionComponent = (props: any) =>{
    const {onSubmit, allowClearProject} = props;
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
                                            sprint_id: ''
                                        });
                                        if(value){
                                            localStorage.setItem('project_id', value);
                                            localStorage.setItem('sprint_id', '');
                                        }
                                        else{
                                            localStorage.setItem('sprint_id', '');
                                        }
                                        // onSubmit(form.getFieldsValue());
                                    }}

                                />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item
                                label="迭代"
                                name={"sprint_id"}
                                style={{width: '90%'}}
                                initialValue={currentSprintId}
                            >
                                <SelectSprint
                                    project_id={currentProjectId}
                                    onChange={(value)=>{
                                        localStorage.setItem('sprint_id', value || '');
                                        // onSubmit(form.getFieldsValue());
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item
                                label="状态"
                                name={"status"}
                                style={{width: '90%'}}
                                initialValue={0}
                            >
                                <Select
                                    allowClear
                                    options={[
                                        {label: '进行中', value: 0},
                                        {label: '已完成', value: 1}
                                    ]}
                                />
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