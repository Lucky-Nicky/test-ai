import {FunctionComponent, useEffect, useState} from "react";
import {
    Result,
    Table,
    Modal
} from 'antd'
import './index.less'
import {Simulate} from "react-dom/test-utils";
import error = Simulate.error;
export const ErrImportCasesResult:FunctionComponent = (props: any) =>{
    const {open, onCancel, errorDate} = props;
    const [dataSource, setDataSource] = useState([]);
    const [total, setTotal] = useState(0);
    const columns = [
        {
            title: '序号',
            dataIndex: 'index',
            key: 'index',
        },
        {
            title: '用例名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '模块',
            dataIndex: 'node_path',
            key: 'node_path',
        },
        {
            title: '失败原因',
            dataIndex: 'message',
            key: 'message',
        }
    ];
    useEffect(()=>{
        setDataSource(errorDate.failed.map((x:any, index:number)=>{
            return {
                index: index + 1,
                name: x.t?.name,
                node_path: x.t?.nodePath,
                message: x.errMsg
            }
        }));
        setTotal(errorDate.total);
    }, [errorDate])
    return(
        <Modal
            open={open}
            onCancel={onCancel}
            width={1000}
            onOk={onCancel}
        >
            <Result
                status={"error"}
                title={`导入${total}条用例失败，错误信息如下:`}
                extra={
                    <Table
                        rowKey={'index'}
                        dataSource={dataSource}
                        columns={columns}
                        pagination={{pageSize: 5}}
                    />

                }
            />
        </Modal>
    )



}
