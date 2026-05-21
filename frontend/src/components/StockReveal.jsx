import React, { useState } from 'react';

const STOCK_REAL_NAMES = {
    // 科技
    "科技-01": { name: "科大讯飞", code: "002230.SZ", desc: "国内人工智能与语音识别龙头，代表A股AI应用浪潮的潮起潮落。" },
    "科技-02": { name: "中芯国际", code: "688981.SH", desc: "中国大陆规模最大、技术最先进的半导体晶圆代工上市公司。" },
    "科技-03": { name: "北方华创", code: "002371.SZ", desc: "半导体设备核心支柱，受益于国产芯片替代的强力支撑。" },
    "科技-04": { name: "立讯精密", code: "002475.SZ", desc: "苹果供应链巨头，精密智能制造与电子制造服务龙头。" },
    "科技-05": { name: "韦尔股份", code: "603501.SH", desc: "全球车载与手机CIS芯片主流厂商，随半导体周期起舞的龙头。" },
    "科技-06": { name: "浪潮信息", code: "000977.SZ", desc: "算力服务器龙头老大，A股AI算力基础设施的核心风向标。" },
    "科技-07": { name: "金山办公", code: "688111.SH", desc: "国产办公软件标杆，主打WPS Office和AI协同办公升级。" },
    
    // 消费
    "消费-01": { name: "贵州茅台", code: "600519.SH", desc: "A股股王，高端酱香白酒与中国核心资产的至尊代表。" },
    "消费-02": { name: "五粮液", code: "000858.SZ", desc: "浓香型白酒杰出代表，长期跟随白酒高端化消费脉搏。" },
    "消费-03": { name: "伊利股份", code: "600887.SH", desc: "中国乳业双雄之一，具备极强的防御属性与稳定高分红。" },
    "消费-04": { name: "格力电器", code: "000651.SZ", desc: "白电巨头，以高分红和极强的空调市占率闻名于世。" },
    "消费-05": { name: "美的集团", code: "000333.SZ", desc: "多元化家电与工业机器人集团，全球白电制造体系集大成者。" },
    "消费-06": { name: "农夫山泉", code: "09633.HK", desc: "“大自然的搬运工”，拥有极高的行业毛利率与护城河。" },
    "消费-07": { name: "牧原股份", code: "002714.SZ", desc: "“猪中茅台”，受强烈猪周期波动影响的重资产农业养殖龙头。" },
    
    // 制造
    "制造-01": { name: "宁德时代", code: "300750.SZ", desc: "“宁王”，全球动力电池之王，新能源时代的超级独角兽。" },
    "制造-02": { name: "比亚迪", code: "002594.SZ", desc: "全球新能源汽车销量之冠，垂直整合产业链的先进制造典范。" },
    "制造-03": { name: "隆基绿能", code: "601012.SH", desc: "光伏硅片与组件龙头，经历光伏行业产能过剩大周期的洗礼。" },
    "制造-04": { name: "三一重工", code: "600031.SH", desc: "工程机械龙头，随着基建与海外出口周期起舞的硬核重工业。" },
    "制造-05": { name: "中国中车", code: "601766.SH", desc: "高铁“国家名片”，承担了中国乃至世界高铁基建核心装备制造。" },
    "制造-06": { name: "汇川技术", code: "300124.SZ", desc: "工控自动化龙头，被称为“工控界的小华为”。" },
    
    // 医药
    "医药-01": { name: "恒瑞医药", code: "600276.SH", desc: "中国创新药与抗肿瘤药物龙头，正从仿制药转型创新药巨头。" },
    "医药-02": { name: "药明康德", code: "603259.SH", desc: "CXO全球医药外包研发之王，受国际政策变动影响剧烈。" },
    "医药-03": { name: "迈瑞医疗", code: "300760.SZ", desc: "医疗器械领域一哥，提供全套监护仪及医学影像核心方案。" },
    "医药-04": { name: "片仔癀", code: "600436.SH", desc: "国家绝密配方护城河，中药奢侈品的典型代表。" },
    "医药-05": { name: "爱尔眼科", code: "300015.SZ", desc: "眼科连锁医院龙头，极具消费属性的民营医疗服务标杆。" },
    
    // 金融
    "金融-01": { name: "招商银行", code: "600036.SH", desc: "零售银行之王，商业银行体系中资产配置效率的优秀典范。" },
    "金融-02": { name: "中国平安", code: "601318.SH", desc: "综合金融保险巨头，旗下布局保险、银行与大科技板块。" },
    "金融-03": { name: "中信证券", code: "600030.SH", desc: "“麦子店高盛”，A股券商一哥，行情牛熊市的杠杆放大器。" },
    "金融-04": { name: "工商银行", code: "601398.SH", desc: "“宇宙行”，国家信用背书的金融压舱石，高分红稳健代表。" },
    "金融-05": { name: "东方财富", code: "300059.SZ", desc: "互联网券商与基金代销龙头，成交量放大时的牛市急先锋。" }
};

const getStockRealInfo = (stockId) => {
    if (STOCK_REAL_NAMES[stockId]) {
        return STOCK_REAL_NAMES[stockId];
    }
    const parts = stockId.split('-');
    const cat = parts[0] || "科技";
    const num = parts[1] || "01";
    const nameMap = {
        "科技": `科创星辰 ${num}号`,
        "消费": `国潮消费 ${num}号`,
        "制造": `智能制造 ${num}号`,
        "医药": `生物医药 ${num}号`,
        "金融": `红利金融 ${num}号`
    };
    return {
        name: nameMap[cat] || `优质企业 ${stockId}`,
        code: `600${num}.SH`,
        desc: `这是一家在 ${cat} 领域深耕多年的优秀 A 股上市公司。`
    };
};

/**
 * 揭秘身份卡片列表组件
 * @param {Array} stockList - 本局对局的 15 支股票名列表
 */
export default function StockReveal({ stockList }) {
    const [flipped, setFlipped] = useState({});

    const toggleFlip = (stock) => {
        setFlipped(prev => ({
            ...prev,
            [stock]: !prev[stock]
        }));
    };

    return (
        <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #333', paddingBottom: '6px', color: 'var(--neon-green)' }}>
                🔍 现实 A 股上市公司映射揭秘 (点击翻牌)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {stockList.map((stock) => {
                    const info = getStockRealInfo(stock);
                    const isFlipped = !!flipped[stock];

                    return (
                        <div
                            key={stock}
                            onClick={() => toggleFlip(stock)}
                            style={{
                                perspective: '1000px',
                                width: '100%',
                                height: '110px',
                                cursor: 'pointer'
                            }}
                        >
                            <div
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    height: '100%',
                                    transition: 'transform 0.6s',
                                    transformStyle: 'preserve-3d',
                                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                }}
                            >
                                {/* 正面 (Front Face): 显示局内代号 */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backfaceVisibility: 'hidden',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: '1px solid #333',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>局内代码</span>
                                    <strong style={{ fontSize: '14px', color: '#fff', marginTop: '4px' }}>{stock}</strong>
                                    <span style={{ fontSize: '9px', color: 'var(--neon-green)', marginTop: '8px' }}>点击翻牌 ➔</span>
                                </div>

                                {/* 背面 (Back Face): 显示现实上市公司名字与代码 */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)',
                                        background: 'rgba(0, 230, 118, 0.05)',
                                        border: '1px solid var(--neon-green)',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{info.name}</div>
                                        <div style={{ fontSize: '9px', color: 'var(--text-gray)', marginTop: '2px' }}>{info.code}</div>
                                    </div>
                                    <div style={{ fontSize: '8px', color: '#ccc', lineHeight: '1.2', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                        {info.desc}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
