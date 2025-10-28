import React, {FunctionComponent, useEffect, useState} from "react";
import {
    message,
    Modal, Space, Tag, Table, Button, Drawer, Form, Input, Divider, Row, Col, Avatar
} from 'antd';
import styles from "@/pages/sprint_management/index.less";
import showdown from "showdown";


export const ButchReviewDrawer: FunctionComponent = (props: any) => {
    const {open, onOk, onClose, caseData,answer, isAnswerDone, onReviewAgain, onManualAsk, onStopAI, onMarkResult, onOpenFailModal} = props;
    const getResultTag = (result)=>{
        switch (result) {
            case 'Pass':
                return <Tag color={"green-inverse"}>通过</Tag>
            case 'UnPass':
                return <Tag color={"red-inverse"}>未通过</Tag>
            default:
                return <Tag color={"yellow-inverse"}>评审中</Tag>

        }
    };
    const convertToHtml = (text: any) => {
        let converter = new showdown.Converter();
        return converter.makeHtml(text)
    };
    const [form] = Form.useForm();
    const columns = [
        {
            title: '序号',
            dataIndex: 'xh',
            key: 'xh',
            width: 70,
            render: (text: any, record: any, index: any) => `${index + 1}`,
        },
        {
            title: '用例编号',
            dataIndex: 'num',
            key: 'num',
            width: 100
        },
        {
            title: '用例名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '用例等级',
            dataIndex: 'priority',
            key: 'priority',
            width: 100
        },
        {
            title: '评审状态',
            dataIndex: 'reviewStatus',
            key: 'reviewStatus',
            width: 100,
            render:(text:any, record:any)=>{
                return getResultTag(text);
            }
        },

    ];
    return (
        <Drawer
            title={`批量评审(共${caseData?.length}条用例)` }
            open={open}
            width={1000}
            onOk={onOk}
            onClose={onClose}
            footer={(
                <Space>
                    <Button
                        type={"primary"}
                        onClick={() => {
                            onStopAI()
                            onMarkResult()
                        }}
                    >
                        通过
                    </Button>
                    <Button
                        onClick={()=>{
                            onStopAI();
                            onOpenFailModal()
                        }}
                        type={"primary"}
                    >
                        失败
                    </Button>
                    <Divider
                        type={"vertical"}
                    />
                    {
                        isAnswerDone && (
                            <Button
                                disabled={!answer}
                                onClick={() => {
                                    onReviewAgain()
                                }}
                            >再次评审</Button>
                        )
                    }
                    {
                        isAnswerDone && (
                            <Button
                                disabled={!answer}
                                onClick={() => {
                                    onManualAsk()
                                }}
                            >{'人工提问'}</Button>
                        )
                    }
                    {
                        !isAnswerDone && (
                            <Button
                                onClick={() => {
                                    onStopAI()
                                }}
                            >{'停止'}</Button>
                        )
                    }
                </Space>
            )}
        >
            <Table
                dataSource={caseData}
                columns={columns}
                rowKey={'id'}
                pagination={{defaultPageSize:10, showSizeChanger: true}}
                scroll={{y: 300}}
            />
            <Divider>AI评审意见</Divider>
            <div className={styles.reviewArea}>
                <Space align={"baseline"}>
                    <Avatar size={30} style={{backgroundColor: '#f56a00'}}>AI</Avatar>
                    {answer ?
                        (
                            <div
                                dangerouslySetInnerHTML={{__html: convertToHtml(answer)}}
                            />
                        )
                        :
                        <div
                            dangerouslySetInnerHTML={{__html: convertToHtml('AI响应中...')}}
                        />
                    }
                </Space>

            </div>
        </Drawer>
    )
}

