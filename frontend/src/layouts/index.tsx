import { Link, Outlet, history, useLocation } from 'umi';
import React, { useState, useEffect } from 'react';
import {
    DesktopOutlined,
    PieChartOutlined,
    AppstoreOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import styles from './index.less';
import './global.less'
import {Breadcrumb, Layout, Menu, Space, theme, version} from 'antd';
const { Header, Content, Footer, Sider } = Layout;
export default () => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const items:any = [
        // {key: '/', label: '首页', icon: <AppstoreOutlined /> },
        {key: '/prd_management', label: '产品需求', icon: <DesktopOutlined /> },
        {key: '/plan_management', label: '测试计划', icon: <DesktopOutlined /> },
        {key: '/generate_cases', label: '功能用例', icon: <DesktopOutlined /> },
        // {key: '/auto_api', label: '接口用例', icon: <DesktopOutlined />, children: [
        //         {key: '/definition_api', label: '接口录入', icon: <DesktopOutlined /> },
        //     ] },
        {key: 'review_case', label: '测试评审', icon: <DesktopOutlined /> , children: [
                {key: '/review_prds', label: '需求评审', icon: <DesktopOutlined />},
                // {key: '/review_cases', label: 'AI用例', icon: <DesktopOutlined />},
                {key: '/review_cases_ms', label: '用例评审', icon: <DesktopOutlined />}
            ]},
        {key: '/data_prepare', label: '数据准备', icon: <DesktopOutlined /> },
        {key: '/ai_chat', label: 'AI问答', icon: <DesktopOutlined /> },
        {key: 'data_monitor', label: '数据监控', icon: <DesktopOutlined />, children: [
                {key: '/sprint_statics', label: '迭代统计', icon: <PieChartOutlined /> },
            ]},
        {key: 'base_data', 'label': '基础数据', icon: <DesktopOutlined />, children:[
                {key: '/sprint_management', label: '迭代管理', icon: <PieChartOutlined /> },
                {key: '/prompt_management', label: '语言模板', icon: <FileTextOutlined /> },
                {key: '/llm_management', label: '大模型', icon: <FileTextOutlined /> },
            ]}
    ];
    const handleMenuClick = (e) =>{
        if(e.key.includes('qa_stastics')){
            window.open(e.key)
        }
        else{
            history.push(e.key);
        }

    };
    const getCookie = (name) => {
        const cookieValue = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
        return cookieValue ? cookieValue[2] : null;
    };
    const deleteCookie = (name)=>{
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    const handleLogout = ()=>{
        deleteCookie('username');
        deleteCookie('token');
        history.push('login');
    }
    // useEffect(()=>{
    //     console.log(getCookie('username'))
    // }, []);
  return (
    <Layout style={{height: '100vh'}}>
        <Sider collapsible collapsed={collapsed} onCollapse={(value)=> setCollapsed(value)}>
            <div className={styles.logo}>AI测试平台</div>
            <Menu
                theme={'dark'}
                // defaultSelectedKeys={['1']}
                mode={"inline"}
                items={items}
                onClick={handleMenuClick}
                selectedKeys={location.pathname}
            />
        </Sider>
        <Layout>
            {/*<Header style={{ padding: 0 }} />*/}
            <Content style={{height: '100%', minWidth: 1024, overflow: "auto"}}>
                {/*<Breadcrumb style={{ margin: '16px 0' }}>*/}
                {/*    <Breadcrumb.Item>User</Breadcrumb.Item>*/}
                {/*    <Breadcrumb.Item>Bill</Breadcrumb.Item>*/}
                {/*</Breadcrumb>*/}
                <div className={styles.userInfo}>
                    <Space>
                        <span>你好，{getCookie('username')}</span>
                        <a
                            onClick={handleLogout}
                        >登出</a>
                    </Space>
                </div>
                <div style={{ padding: '0 15px'}}>
                    <Outlet/>
                </div>
            </Content>
            {/*<Footer style={{ textAlign: 'center' }}>Ant Design {version} ©2023 Created by Ant UED</Footer>*/}
        </Layout>

    </Layout>
  );
}
