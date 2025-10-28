import styles from './styles.less';
import {Space} from 'antd'
export default ()=> {
  return (
    <div className={styles.main}>
      <p className={styles.sentence}>
          欢迎来来到AI测试平台，本平台是基于AI大模型打造的一款专门为测试人员提升测试效率的平台，在这里你可以：
      </p>
        <p >
            <Space direction={"vertical"}>
                <span>1、<a href={'/prd_management'}>需求管理：</a> 管理需求，根据需求AI生成用例、AI文档提问</span>
                <span>2、<a href={'/generate_cases'}>用例管理：</a> AI生成/优化测试用例，一键同步测试平台</span>
                <span>3、<a href={'/data_prepare'}>数据准备：</a>让AI帮你造数据</span>
                <span>4、<a href={'/ai_chat'}>AI问答：</a>与AI聊天，一键提取用例与数据</span>
            </Space>
      </p>

    </div>
  );
}
