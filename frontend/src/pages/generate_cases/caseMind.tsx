import React, {FunctionComponent, useState, useEffect, useRef} from "react";
import {
    Button, Input, message,
    Space, Tag, Tooltip, Dropdown, Divider, Popconfirm
} from 'antd';
import { DownOutlined } from '@ant-design/icons';
import './index.less';
import 'jsmind/style/jsmind.css';
import JsMind from 'jsmind';

import {caseMindInitApi, caseMindSaveApi} from "@/apis/casesMind";
import {GenCase} from "@/components/myAntd";

const mind_basic = {
    /* 元数据，定义思维导图的名称、作者、版本等信息 */
    meta: {
        "name": "jsMind-demo-tree",
        "author": "hizzgdev@163.com",
        "version": "0.2"
    },
    /* 数据格式声明 */
    format: "node_array",
}

export const CaseMind: FunctionComponent = (props: any) => {
    const {nodesData, searchParams, onSaveMinds, onClose} = props;
    const [mindData, setMindData] = useState([]);
    const [removedIds, setRemovedIds] = useState([]);
    const [boxPosition, setBoxPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        zoom: 1
    });
    const [showBox, setShowBox] = useState(false);
    const [currentNodeInfo, setCurrentNodeInfo] = useState(null);
    const [genCaseOpen, setGenCaseOpen] = useState(false);
    const [copyNode, setCopyNode] = useState(null);
    const [pasteId, setPasteId] = useState(null);
    const editableRef = useRef(null);
    const options = {
        container: 'jsmind_container',
        theme: 'clouds',
        editable: true,
        mode: 'side',
        log_level: 'error',
        layout: {
            hspace: 100,
            vspace: 20,
            pspace: 20
        },
        view: {
            expander_style: 'number',
            engine: 'canvas',
            // hmargin: 100,
            // vmargin: 50,
            // line_width: 2,
            line_color: '#ddd',
            node_overflow: 'hidden',
            hide_scrollbars_when_draggable: true,
            draggable: true,
            zoom: {             // 配置缩放
                min: 0.5,       // 最小的缩放比例
                max: 2.1,       // 最大的缩放比例
                step: 0.1,      // 缩放比例间隔
            },
            custom_node_render: (jm, element, node) => {
                // switch (node.data.data.type) {
                //     case 'module':
                //         node.data['font-size'] = '16';
                //         break
                //     case 'case':
                //         node.data['font-size'] = '12';
                //         break
                //     case 'caseStep':
                //         node.data['font-size'] = '12';
                //         break
                //     case 'caseResult':
                //         node.data['font-size'] = '12';
                //         break
                // }
                node.topic = handleGetTopicHtml(node);
                if (node.data.is_edit) {
                    node.data = {
                        ...node.data,
                        'background-color': '#de911f'
                    }
                }
                return false
            }
        },
        shortcut: {
            enable: true,        // 是否启用快捷键
            handles: {
                'delnode1': (jm, e) => {
                    jm.get_selected_node() && handleRemoveNode(jm.get_selected_node());
                },
                'addchild1': (jm, e) => {
                    if(!jm.get_selected_node()){
                        return
                    }
                    const node_id = gainUniqueId();
                    const parent = jm.get_selected_node();
                    let data;
                    if (parent.data?.data?.type == 'case') {
                        data = {is_edit: true, data: {topic: 'New Node', type: 'caseStep'}}
                    } else if (parent.data.data.type == 'caseStep') {
                        data = {is_edit: true, data: {topic: 'New Node', type: 'caseResult'}}
                    } else {
                        data = {
                            is_edit: true,
                            data: {topic: 'New Node', type: 'case', priority: 'P1'}
                        }
                    }
                    jm.add_node(parent.id, node_id, 'New Node', data);
                    jm.select_node(node_id);
                    setCurrentNodeInfo(jm.get_selected_node());
                    setShowBox(true);
                },
                'addbrother1': (jm, e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const node_id = Math.random().toString(36).substring(2)
                    const brother = jm.get_selected_node();
                    let data = JSON.parse(JSON.stringify(brother.data));
                    data.data.topic = 'New Node';
                    data.is_edit = true;
                    if(brother.data?.data?.type == 'casePre'){
                        data.data.type = 'caseStep';
                    }
                    jm.insert_node_after(brother, node_id, 'New Node', data);
                    jm.select_node(node_id);
                    setCurrentNodeInfo(jm.get_selected_node());
                    setShowBox(true);

                },
                'copy': (jm, e)=>{
                    if(jm.get_selected_node() && !jm.get_selected_node().isroot){
                        setCopyNode({
                            ...jm.get_selected_node()
                        });
                    }
                },
                'cut':(jm, e)=>{
                    if(jm.get_selected_node() && !jm.get_selected_node().isroot){
                        setCopyNode(deepCopy({...jm.get_selected_node()}));
                        // setCopyNode({...jm.get_selected_node()});
                        handleRemoveNode(jm.get_selected_node());
                    }
                },
                'paste': (jm, e)=>{
                    jm.get_selected_node() && setPasteId(jm.get_selected_node());
                },
                // 'save': (jm, e)=>{
                //     e.preventDefault();
                //     e.stopPropagation();
                //     handleSaveMind();
                // }
            },         // 命名的快捷键事件处理器
            mapping: {           // 快捷键映射
                addchild1: [9, 4096 + 13], 	// <Insert>, <Ctrl> + <Enter>
                addbrother1: 13,    // <Enter>
                editnode: 113,   // <F2>
                delnode1: 46,    // <Delete>
                toggle: 32,    // <Space>
                left: 37,    // <Left>
                up: 38,    // <Up>
                right: 39,    // <Right>
                down: 40,    // <Down>
                copy: 4096 + 67,  // Ctrl + c
                cut: 4096 + 88,  // Ctrl + x
                paste: 4096 + 86,  // Ctrl + v
                // save: 4096 + 83  // Ctrl + s
            }
        },

    };
    const  deepCopy = (obj) =>{
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        let newObj = Array.isArray(obj) ? [] : {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key) && key != 'parent') {
                newObj[key] = deepCopy(obj[key]);
            }
        }
        return newObj;
    };
    const gainUniqueId = () => {
        return Math.random().toString(36).substring(2)
    };
    const handleMindInit = async () => {
        setShowBox(false);
        setRemovedIds([]);
        const res: any = await caseMindInitApi({
            nodes_data: nodesData,
            ...searchParams
        })
        if (res.success) {
            setMindData(res.data);
        }
    };
    const getCaseColor = (text: string) => {
        switch (text?.toUpperCase()) {
            case 'P1':
                return '#f80'
            case 'P2':
                return '#783887'
            case 'P3':
                return '#00d6b9'
            default:
                return ''
        }
    };
    const handleGetTopicHtml = (node_info) => {
        const data_info = node_info?.data?.data;
        switch (data_info?.type) {
            case 'module':
                return `<div title="${data_info.topic}"><span style="background: #7fb7f6; margin-right: 5px; padding: 1px 5px; border-radius: 5px">模块</span>${data_info.topic}<div/>`
            case 'case':
                const color = getCaseColor(data_info.priority);
                return `<div title="${data_info.topic}"><span style="background: ${color}; color: #fff; margin-right: 5px; padding: 1px 5px; border-radius: 5px">${data_info.priority}</span>${data_info.topic}<div/>`
            case 'casePre':
                return `<div title="${data_info.topic}"><span style="background: #b1ee03; margin-right: 5px; padding: 1px 5px; border-radius: 5px;">前置条件</span>${data_info.topic}<div/>`
            case 'caseStep':
                return `<div title="${data_info.topic}">${data_info.topic}<div/>`
            case 'caseResult':
                return `<div title="${data_info.topic}">${data_info.topic}<div/>`
            default:
                return node_info.topic
        }
    };
    const handleSingleClick = async (jm) => {
        const jmnodes: any = document.getElementsByTagName("jmnode");
        Object.values(jmnodes).forEach((jmnode) => {
            jmnode.onclick = async function (e) {
                setCurrentNodeInfo(jm.get_selected_node());
                setShowBox(false);
                e.preventDefault();
                e.stopPropagation();
            };
        });
    };
    const handleDoubleClick = (jm) => {
        const jmnodes: any = document.getElementsByTagName("jmnode");
        Object.values(jmnodes).forEach((jmnode) => {
            jmnode.ondblclick = function (e) {
                setShowBox(true);
                e.preventDefault();
                e.stopPropagation();
            };
        });
    };
    const handleSetEditProperty = ()=>{
        if (currentNodeInfo.data?.data?.type == 'case') {
            if (!currentNodeInfo.parent || currentNodeInfo.parent.data.data.type != 'module') {
                message.error('该节点无法更新为用例');
                return
            }
        }
        // 前置条件更新，用例打上更新标志
        else if (currentNodeInfo.data?.data?.type == 'casePre') {
            if (!currentNodeInfo.parent || currentNodeInfo.parent.data.data.type != 'case') {
                message.error('该节点无法更新为前置条件');
                return
            }
            currentNodeInfo.parent.data.is_edit = true;
            JsMind.current.update_node(currentNodeInfo.parent.id, currentNodeInfo.parent.topic);
        }
        // 用例步骤更新，用例也同步也打上更新标志
        if (currentNodeInfo.data?.data?.type == 'caseStep') {
            if (!currentNodeInfo.parent || currentNodeInfo.parent.data.data.type != 'case') {
                message.error('该节点无法更新为用例步骤');
                return
            }
            currentNodeInfo.parent.data.is_edit = true;
            JsMind.current.update_node(currentNodeInfo.parent.id, currentNodeInfo.parent.topic);
        }
        // 预期结果更新，用例和模块同步也打上更新标志
        else if (currentNodeInfo.data?.data?.type == 'caseResult') {
            if (!currentNodeInfo.parent?.parent || currentNodeInfo.parent.parent.data.data.type != 'case') {
                message.error('该节点无法更新为用例结果');
                return
            }
            currentNodeInfo.parent.parent.data.is_edit = true;
            JsMind.current.update_node(currentNodeInfo.parent.parent.id, currentNodeInfo.parent.parent.topic);
        }
    }
    const handleSaveNode = async (info) => {
        if (!currentNodeInfo) {
            message.error('请先选择一个node');
            return
        }
        if(
            info.type
            && ['case', 'module'].indexOf(currentNodeInfo?.data.data.type) > -1
            && currentNodeInfo?.id.includes('-')
            && info?.type != currentNodeInfo?.data?.data?.type
        ){
            message.error('已保存的模块暂不支持修改类型，请删除后新建');
            return
        }
        currentNodeInfo.data.data = {
            ...currentNodeInfo.data.data,
            ...info,
        }
        !currentNodeInfo.data.data.topic && (currentNodeInfo.data.data.topic = '');

        handleSetEditProperty();
        // 标记自己
        currentNodeInfo.data.is_edit = true;
        JsMind.current.update_node(currentNodeInfo.id, currentNodeInfo.data.data.topic);
        handleSetBoxPosition();
    };
    const handleRemoveNode = (node_info: any = null) => {
        // 模块删除
        if (!node_info.parent) {
            message.info('根模块不允许删除');
            return
        }
        // 用例步骤或者前置条件删除，用例同步也打上更新标志
        else if (node_info.data?.data?.type == 'caseStep' || node_info.data?.data?.type == 'casePre') {
            node_info.parent.data.is_edit = true;
            JsMind.current.update_node(node_info.parent.id, node_info.parent.topic);
        }
        // 预期结果删除，用例同步也打上更新标志
        else if (node_info.data?.data?.type == 'caseResult') {
            node_info.parent.parent.data.is_edit = true;
            JsMind.current.update_node(node_info.parent.parent.id, node_info.parent.parent.topic);
        }
        // 深度拷贝后删除节点
        const deepCopyNode = deepCopy(node_info);
        JsMind.current.remove_node(node_info.id);
        // 如果删除是已保存的模块或者用例，遍历子节点，记录到removed data中
        if (deepCopyNode.id.indexOf('-') > -1 && (deepCopyNode.data.data.type == 'case' || deepCopyNode.data.data.type == 'module')) {
            let removed_arr = [];
            const recordRemovedNodes = (node)=>{
                if(node.id.indexOf('-') > -1 && (node.data.data.type == 'case' || node.data.data.type == 'module')){
                    removed_arr.push(node.id);
                    if(node.children?.length > 0){
                        node.children.forEach((value, index, array)=>{
                            recordRemovedNodes(value);
                        })
                    }
                }
            };
            recordRemovedNodes(deepCopyNode);
            setRemovedIds(prevIds =>{
                return [
                    ...prevIds,
                    ...removed_arr
                ];
            });
        }
        setShowBox(false);
    };
    const handleSetBoxPosition = () => {
        const zoom = JsMind.current.view.zoom_current;
        const top = (currentNodeInfo._data.view.abs_y - 4) * zoom +
            currentNodeInfo._data.view.height -
            window.document.getElementsByClassName('jsmind-inner')[0].scrollTop
        const left = currentNodeInfo._data.view.abs_x * zoom -
            // currentNodeInfo._data.view.width -
            window.document.getElementsByClassName('jsmind-inner')[0].scrollLeft
        setBoxPosition({
            top: top - (currentNodeInfo.isroot ? 10 : 0),
            left: left,
            width: currentNodeInfo._data.view.width * zoom,
            height: currentNodeInfo._data.view.height * zoom,
            zoom: zoom
        })
    };
    const handleSaveMind = async () => {
        // console.log(removedIds);
        const node_tree = JsMind.current.get_data('node_tree').data;
        console.log(node_tree);
        const res: any = await caseMindSaveApi({
            node_tree: node_tree,
            removed_ids: removedIds,
            ...searchParams
        })
        if (res.success) {
            message.success('保存成功');
            setRemovedIds([]);
            onSaveMinds();
        }

    };
    const handleAddCases = (cases) => {
        const parent_id = currentNodeInfo.id;
        cases.forEach((value, index, array) => {
            const topic = value.title;
            const case_id = gainUniqueId();
            const case_node = {
                parent_id: parent_id,
                id: case_id,
                data: {is_edit: true, data: {topic: topic, type: 'case', priority: value.priority}}
            }
            JsMind.current.add_node(case_node.parent_id, case_node.id, topic, case_node.data);
            //添加前置条件
            const pre_id = gainUniqueId();
            JsMind.current.add_node(case_id, pre_id, value.precondition,
                {data: {topic: value.precondition, type: 'casePre'}});
            value.description.forEach((des, index2, array2)=>{
                const step_id = gainUniqueId();
                const step = {
                    parent_id: case_id,
                    id: step_id,
                    data: {data: {topic: des.steps, type: 'caseStep', priority: des.priority}}
                }
                const result_id = gainUniqueId();
                const result = {
                    parent_id: step_id,
                    id: result_id,
                    data: {data: {topic: des.expect_result, type: 'caseResult', priority: des.priority}}
                }
                des.steps && JsMind.current.add_node(step.parent_id, step.id, des.steps, step.data);
                des.expect_result && JsMind.current.add_node(result.parent_id, result.id, des.expect_result, result.data);
            })
        })
    };
    const handlePasteNode = ()=>{
        if(!copyNode){
            return
        }
        const addNode = (parent_id, node_info)=>{
            const uniqueId = gainUniqueId();
            JsMind.current.add_node(parent_id, uniqueId, node_info.topic, {...node_info.data});
            node_info.children?.length > 0 && node_info.children.forEach((value, index, array)=>{
                addNode(uniqueId, value)
            })
        }
        addNode(pasteId, copyNode);
        setPasteId(null);
    };
    const selectAllText = (el) => {
        el.focus();
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(el); // 选择整个内容
        selection.removeAllRanges(); // 清除之前的选择
        selection.addRange(range); // 添加新的选择
    };

    useEffect(() => {
        handleMindInit();
    }, [nodesData, searchParams]);
    useEffect(() => {
        if (mindData.length === 0) {
            return
        }
        window.document.getElementById('jsmind_container').innerHTML = '';
        const jm_t = new JsMind(options);
        jm_t.add_event_listener((event, data) => {
            if (data.evt == 'select_node') {
                handleSingleClick(jm_t);
                handleDoubleClick(jm_t);
            }
        });

        jm_t.show({
            ...mind_basic,
            data: mindData
        });
        // jm_t.expand_to_depth(1);
    }, [mindData]);
    useEffect(() => {
        console.log('选中节点：');
        console.log(currentNodeInfo);
        currentNodeInfo && handleSetBoxPosition();
    }, [currentNodeInfo]);
    useEffect(()=>{
        showBox &&  selectAllText(editableRef.current);
        showBox && handleSetBoxPosition();
    }, [showBox]);
    useEffect(()=>{
        pasteId && handlePasteNode();
    }, [pasteId]);
    return (
        <>
            <div style={{marginBottom: 10}}>
                <Space>
                    <Popconfirm
                        title={'未保存的数据将会丢失，确认返回？'}
                        onConfirm={onClose}
                    >
                        <Button size={"small"}>返回</Button>
                    </Popconfirm>
                    <Button size={"small"} onClick={() => {
                        JsMind.current.scroll_node_to_center(JsMind.current.get_root())
                    }}>重置</Button>
                    <Dropdown menu={{
                        items:[
                            {
                                key:'1',
                                label: (
                                    <a onClick={()=>JsMind.current.collapse_all()}>一级</a>
                                )
                            },
                            {
                                key:'2',
                                label: (
                                    <a onClick={()=>JsMind.current.expand_to_depth(2)}>二级</a>
                                )
                            },
                            {
                                key:'3',
                                label: (
                                    <a onClick={()=>JsMind.current.expand_to_depth(3)}>三级</a>
                                )
                            },
                            {
                                key:'4',
                                label: (
                                    <a onClick={()=>JsMind.current.expand_all(3)}>全部</a>
                                )
                            }
                        ]
                    }}>
                        <Button size={"small"} >
                            展开至
                            <DownOutlined />
                        </Button>
                    </Dropdown>

                    <Button size={"small"} onClick={() => {
                        if(!currentNodeInfo){
                            return
                        }
                        const before_node = JsMind.current.find_node_before(currentNodeInfo.id);
                        if(before_node){
                            handleSetEditProperty();
                            JsMind.current.move_node(currentNodeInfo.id, before_node.id);
                        }
                    }}>上移</Button>
                    <Button size={"small"} onClick={() => {
                        if(currentNodeInfo){
                            if(!currentNodeInfo){
                                return
                            }
                            const next_brother = JsMind.current.find_node_after(currentNodeInfo.id);
                            if(next_brother){
                                handleSetEditProperty();
                                JsMind.current.move_node(next_brother.id, currentNodeInfo.id);
                            }

                        }
                    }}>下移</Button>
                    <Button size={"small"} disabled={!currentNodeInfo} onClick={() => {
                        if(currentNodeInfo.data?.data?.type !== 'module'){
                            message.info('请选择一个模块节点');
                            return
                        }
                        setGenCaseOpen(true)
                    }}>AI创建</Button>
                    <Button size={"small"} type={"primary"} onClick={handleSaveMind}>保存</Button>
                    <Tooltip
                        title={
                            <span>
                                放大/缩放：ctrl + 鼠标滚轮
                                <br/>
                                移动画布：鼠标左键拖动
                                <br/>
                                创建子节点： Tab
                                <br/>
                                创建兄弟节点：Enter
                                <br/>
                                展开/折叠节点： Space
                                <br/>
                                删除节点： Delete
                                <br/>
                                复制：Ctrl+C
                                <br/>
                                剪切：Ctrl+X
                                <br/>
                                粘贴：Ctrl+V
                                <br/>
                                保存： Ctrl+S
                            </span>
                        }
                    >
                        <a>快捷键?</a>
                    </Tooltip>
                    <span>标记节点：</span>
                    <Tag onClick={() => {
                        handleSaveNode({type: 'module'})
                    }} color={'#7fb7f6'} style={{cursor: "pointer"}}>模块</Tag>
                    <Tag onClick={() => {
                        handleSaveNode({type: 'case', priority: 'P1'})
                    }} color={'#f80'} style={{cursor: "pointer"}}>P1</Tag>
                    <Tag onClick={() => {
                        handleSaveNode({type: 'case', priority: 'P2'})
                    }} color={'#783887'} style={{cursor: "pointer"}}>P2</Tag>
                    <Tag onClick={() => {
                        handleSaveNode({type: 'case', priority: 'P3'})
                    }} color={'#00d6b9'} style={{cursor: "pointer"}}>P3</Tag>
                    <Tag onClick={() => {
                        handleSaveNode({type: 'casePre'})
                    }} color={'#b1ee03'} style={{cursor: "pointer"}}>前置条件</Tag>
                    <Tag onClick={() => {
                        handleSaveNode({type: 'caseStep'})
                    }} color={'#40fc01'} style={{cursor: "pointer"}}>步骤</Tag>
                    <Tag onClick={() => {
                        handleSaveNode({type: 'caseResult'})
                    }} color={'#40fc01'} style={{cursor: "pointer"}}>结果</Tag>
                </Space>
            </div>
            <div tabIndex={'0'} id={'jsmind_container'} style={{width: '100%', height: '85vh', overflow: "auto", background: '#fff'}}/>
            {
                showBox && (
                    <div
                        ref={editableRef}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e)=>{
                            if(!e.target.innerText){
                                message.info('请输入内容');
                                setShowBox(false);
                                return
                            }
                            e.target.innerText != currentNodeInfo.data?.data?.topic && handleSaveNode({
                                topic: e.target.innerText
                            });
                            setShowBox(false);
                        }}
                        onKeyPress={(e)=>{
                            // console.log(e);
                            if(e.key == 'Enter'){
                                if(!e.shiftKey){
                                    e.preventDefault();
                                    editableRef.current.blur();
                                    JsMind.current.select_node(currentNodeInfo?.id);
                                    document.getElementsByClassName('jsmind-inner')[0]?.focus();
                                }

                            }
                        }}
                        style={{
                            zIndex: 99,
                            whiteSpace: "pre-wrap",
                            overflow: "hidden",
                            outline: 'none',
                            position: "absolute",
                            top: boxPosition.top,
                            left: boxPosition.left,
                            // transition: '0.1s all',
                            minHeight: boxPosition.height,
                            minWidth: boxPosition.width,
                            background: '#fff',
                            borderRadius: '5px',
                            border: '1px solid grey',
                            fontSize: boxPosition.zoom * 16,
                            boxSizing: "border-box"

                        }}
                    >
                        {currentNodeInfo?.data.data.topic}
                    </div>
                )
            }
            <GenCase
                open={genCaseOpen}
                searchParams={searchParams}
                onCancel={() => setGenCaseOpen(false)}
                onGenerateCase={({cases, chat_id}) => {
                    // console.log(cases);
                    handleAddCases(cases);
                    setGenCaseOpen(false);
                }}
            />
        </>
    )
}