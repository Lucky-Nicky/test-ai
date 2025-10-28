import React, {FunctionComponent, useState, useEffect} from "react";
import {
    Button,
    Space,
    Modal,
    Table,
    message, Switch
} from 'antd'
import {DataPrepareSaveDataApi} from '@/apis/dataPrepare';

export const GenPreviewModal:FunctionComponent = (props: any) =>{
    const {open, onClose, onDelete, genData, dataPrepareId, dataType, onOpenChat} = props;
    const [dataSource, setDataSource] = useState([]);
    const [columns, setColumns] = useState(false);
    const handleSetGenResultColumns = (resultData:any)=>{
        let keys = ['key'];
        resultData.forEach((item, index, arr) =>{
            keys.push(...Object.keys(item))
            keys = Array.from(new Set(keys));
        })
        let basicGenResultColumns:any = keys.map((x:any)=>{
            if (x === 'key'){
                return {
                    title: '序号',
                    dataIndex: 'key',
                    key: 'key',
                    width: 70,
                }
            }
            return {
                title: x,
                dataIndex: x,
                key: x,
                width: 150,
                ellipsis: true
            }
        })
        basicGenResultColumns = [
            ...basicGenResultColumns,
            {
                title: '操作',
                dataIndex: 'operation',
                key: 'operation',
                width: 100,
                fixed: 'right',
                render: (text:any, record:any)=>(
                    <Space>
                        <Button
                            type={"link"}
                            size={"small"}
                            onClick={()=>{
                                handleDeleteGenResult(record.key);
                            }}
                        >
                            删除
                        </Button>
                    </Space>
                )

            }
        ]

        setColumns(basicGenResultColumns);
    };
    const handleDeleteGenResult = (key)=>{
        // setDataSource(dataSource.filter((x)=>x.key !== key))
        onDelete(key);
    };
    const handleSaveData = async(isAdd:boolean)=>{
        const res:any = await DataPrepareSaveDataApi({
            data: dataSource,
            data_prepare_id: dataPrepareId,
            is_add: isAdd,
            data_type: dataType
        })
        if(res.success){
            message.success('操作成功');
            onClose()
        }
    }
    useEffect(()=>{
        setDataSource(genData);
        handleSetGenResultColumns(genData);
        }, [genData]);
    return (
        <Modal
            width={1000}
            title={dataType === 1 ? '【正向】测试数据预览' : '【逆向】测试数据预览'}
            open={open}
            okText={'覆盖'}
            cancelText={'取消'}
            onOk={()=>{
                handleSaveData(false)
            }}
            onCancel={onClose}
            footer={(_, { OkBtn, CancelBtn})=>(
                <>
                    <Button
                        type={"link"}
                        onClick={onOpenChat}
                    >不满意？点我进入聊天模式</Button>
                    <CancelBtn />
                    <Button
                        type={"primary"}
                        onClick={()=>handleSaveData(true)}
                    >追加</Button>
                    <OkBtn />
                </>
            )}
        >
            <Table
                columns={columns}
                dataSource={dataSource}
                scroll={{x:800,}}
                pagination={{defaultPageSize:10, showSizeChanger: true}}
            >
            </Table>

        </Modal>
    )
}
