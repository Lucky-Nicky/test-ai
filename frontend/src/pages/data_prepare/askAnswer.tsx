import React, {FunctionComponent, useState, useEffect} from "react";
import {
    Avatar, Button,
    Col,
    Divider, Drawer,
    Input, message,
    Modal, Radio, Row, Select, Space

} from 'antd'
import {DataPrepareDataRecommendPrepareApi} from "@/apis/dataPrepare";
import {LlmCreateChatApi, LlmAskApi} from "@/apis/llm";
import showdown from "showdown";
import hljs from "highlight.js/lib/common";
import 'highlight.js/styles/stackoverflow-dark.css';
import copy from "copy-to-clipboard";

export const AskAnswer:FunctionComponent = (props: any) =>{
    const {open, onCancel, dataPrepareInfo, projectId} = props;
    const [rule, setRule] = useState([]);
    const [values, setValues] = useState([]);
    const [dataType, setDataType] = useState(1);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [chatId, setChatId] = useState(null);
    const [loading, setLoading] = useState(false);
    const handleSetRule = (values)=>{
        if(values.length == 0){
            setRule([]);
            return;
        }
        const demandRows:any = dataPrepareInfo?.columns_demand.filter(x=>values.indexOf(x.name)>=0);
        setRule(demandRows.map(demandRow=>{
            let description = [];
            demandRow.unique ? description.push('唯一'): description.push('不唯一');
            demandRow.required ? description.push('必填') : description.push('非必填');
            (demandRow.len?.num && demandRow.len?.symbol != 0) && description.push(((demandRow.len.symbol === 1 ? '<=': '=') + demandRow.len.num + '字符'));
            demandRow.logistic && description.push(demandRow.logistic);
            return `【${demandRow.name}】` + (description.length > 0 ? description.join('，') : null)
        }))
    };
    const handleSetQuestion = (values)=>{
        if(values.length == 0){
            setQuestion('')
            return
        }
        if(dataType == 1){
            setQuestion(`基于边界值、等价类、正交试验等等方法生成覆盖各种场景的测试数据。`)
        }
        if(dataType == 2){
            setQuestion(`生成各种异常数据，例如：与逻辑不符，必填字段为空，数据类型不正确等等。`)
        }
    };
    const createChat = async ()=>{
        const res:any = await LlmCreateChatApi({
            project_id: projectId,
        });
        if(res.success){
            setChatId(res.data.id);
            return res.data.id
        }
        return null
    };
    const highlightCode = ()=>{
        const codes = document.querySelectorAll('pre code');
        codes.forEach((el:any) => {
            if(loading){  // 如果AI回复中，跳过渲染，不然页面会一直闪烁
                // console.log('111');
                return
            }
            // 让code进行高亮
            hljs.highlightElement(el);
            // 为每个代码块添加一个复制按钮
            const copyButton = document.createElement('Button');
            copyButton.textContent = '复制';
            const codeBlock = el.parentNode;
            codeBlock.appendChild(copyButton);
            // 为复制按钮添加一个点击事件
            copyButton.addEventListener('click', (event) => {
                // 使用clipboard.js来复制代码块的内容
                copy(el.innerText);
                message.success('复制成功');
            });

        })
    };
    const handleAskPrepare = async ()=>{
        setLoading(true);
        message.info('AI准备中...');
        setAnswer('AI响应中......')
        const res:any = await DataPrepareDataRecommendPrepareApi({
            chat_id: await createChat(),
            columns_demand: dataPrepareInfo.columns_demand,
        })
        setLoading(false);
        if(res.success){
            message.success('AI准备完成');
            setAnswer(res.data);
        }
    };
    const handleAsk = async ()=>{
        if(rule.length == 0){
            message.info('请选择字段');
            return
        }
        if(!question){
            message.info('请输入问题');
            return
        }
        setLoading(true);
        if(!chatId){
            return message.error('没有chat id')
        }
        setAnswer('AI响应中......')
        const res:any = await LlmAskApi({
            chat_id: chatId,
            question: `字段${values.join('、')}，` + question
        })
        setLoading(false);
        if(res.success){
            setAnswer(res.data);
        }
    };
    const convertToHtml = (text: any) => {
        let converter = new showdown.Converter();
        return converter.makeHtml(text)
    };
    useEffect(()=>{
        if(dataPrepareInfo && open){
            if(!chatId){
                handleAskPrepare()
            }
        }
    }, [dataPrepareInfo, open])

    useEffect(()=>{
        handleSetQuestion(values);
    }, [values, dataType]);

    useEffect(()=>{
        highlightCode();
    }, [answer]);
    return (
        <Drawer
            width={1000}
            title={'AI智能推荐'}
            open={open}
            onOk={handleAsk}
            onClose={onCancel}
            footer={
                <Space>
                    <Button onClick={onCancel}>关闭</Button>
                    <Button type={'primary'} onClick={handleAsk} disabled={loading}>AI推荐</Button>
                </Space>
            }
        >

            <Row>
                <Col span={12}>
                    <Divider>选择字段</Divider>
                    <Space direction={"vertical"}>
                        <Select
                            allowClear
                            mode="multiple"
                            maxCount={3}
                            placeholder={'请选择字段'}
                            style={{width: 300}}
                            options={dataPrepareInfo?.columns_demand}
                            fieldNames={{label: 'name', value: 'name'}}
                            value={values}
                            onChange={(value)=>{
                                handleSetRule(value);
                                setValues(value);
                            }}
                        />
                        <Radio.Group
                            value={dataType}
                            onChange={(e)=>setDataType(e.target.value)}>
                            <Radio value={1}>正向</Radio>
                            <Radio value={2}>逆向</Radio>
                        </Radio.Group>
                    </Space>
                </Col>
                <Col span={12}>
                    <Divider>逻辑展示</Divider>
                    <div  style={{maxHeight:200, overflow: "auto"}}>
                        <Space direction={"vertical"}>
                            {rule.map((x, index:number)=>(<span key={index}>{x}</span>))}
                        </Space>
                    </div>
                </Col>
            </Row>


            <Divider>AI提问</Divider>
            <Input.TextArea
                disabled={loading}
                autoSize={{minRows:3,maxRows:5}}
                value={question}
                onChange={(e)=>setQuestion(e.target.value)}
            />
            <Divider>AI回答</Divider>
            <div>
                <Space align={"baseline"}>
                    <Avatar size={30} style={{backgroundColor: '#f56a00'}}>AI</Avatar>
                    <div>
                        <div
                            dangerouslySetInnerHTML={{__html: convertToHtml(answer)}}
                        />
                    </div>
                </Space>
            </div>






        </Drawer>
    )
}
