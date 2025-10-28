import React, {useState, useEffect} from "react";
import {history} from "umi";
import styles from './index.less';
import {
    Button, Col, Divider,
    Form, Input, message, Row,
} from 'antd';
import {loginApi} from "@/apis/login";

export default () =>{
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const handleLogin = ()=>{
        form
            .validateFields()
            .then(async (values)=>{
                setLoading(true);
                const res:any = await loginApi({
                    ...values
                })
                setLoading(false);
                if(res.success){
                    message.success('登录成功');
                    history.push('/prd_management')
                }
            })
    }

    return (
        <>
            <div className={styles.loginArea}>
                <Row>
                    <Col span={11}>
                        <div style={{padding: 10}}>
                            <Form
                                disabled={loading}
                                labelCol={{span: 6}}
                                form={form}>
                                <Form.Item
                                    name={'username'}
                                    rules={[{required: true}]}
                                >
                                    <Input
                                        placeholder={'请输入用户名'}
                                        style={{width: 250}}
                                    />
                                </Form.Item>
                                <Form.Item
                                    name={'password'}
                                    rules={[{required: true}]}
                                >
                                    <Input
                                        placeholder={'请输入密码'}
                                        type={"password"}
                                        onPressEnter={handleLogin}
                                        style={{width: 250}}
                                    />
                                </Form.Item>
                                <Form.Item
                                >
                                    <Button
                                        loading={loading}
                                        onClick={handleLogin}
                                        type={"primary"}
                                        style={{width: 250}}
                                    >登 录</Button>
                                </Form.Item>
                            </Form>
                        </div>
                    </Col>
                    <Col>
                        <Divider
                            type={"vertical"}
                            style={{height: '100%'}}
                        />
                    </Col>
                    <Col span={11}>
                        <div style={{padding: 10}}>
                            <h2>欢迎使用AI测试平台</h2>
                            <p>请使用域账号登录</p>
                        </div>
                    </Col>
                </Row>
            </div>



        </>

    )
}