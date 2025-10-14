import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

interface HeatmapItem {
    latest_reserve0: string;
    poolid: string;
    reserve0_ratio: number;
    tokenmetadata: {
        fullname: string;
        ticker: string;
        geoTag: string;
        weatherTag: string;
        eventDescription: string;
        eventTypes: string[];
    };
}

const CoinLiquity: React.FC = () => {
    const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        /**
         * 本地示例数据文件 (Cmd/Ctrl+点击可在 JetBrains 系列 IDE 中跳转)
         * @see src/sample_data/heatmap.json
         */
        axios.get("http://10.18.23.51:3000/swap/heatmap")
            .then(res => setHeatmap(res.data))
            .catch(err => setError("获取热力图数据失败"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <h3>池热力图</h3>
            {loading && <div>加载中...</div>}
            {error && <div style={{color: 'red'}}>{error}</div>}
            {!loading && !error && (
                <table border={1} cellPadding={6} style={{width: '100%', marginTop: 12}}>
                    <thead>
                        <tr>
                            <th>池ID</th>
                            <th>代币</th>
                            <th>全名</th>
                            <th>原生储备</th>
                            <th>储备比例</th>
                            <th>地理标签</th>
                            <th>天气标签</th>
                        </tr>
                    </thead>
                    <tbody>
                        {heatmap.map((item, idx) => (
                            <tr key={item.poolid + idx}>
                                <td>{item.poolid}</td>
                                <td>{item.tokenmetadata.ticker}</td>
                                <td>{item.tokenmetadata.fullname}</td>
                                <td>{item.latest_reserve0}</td>
                                <td>{item.reserve0_ratio}</td>
                                <td>{item.tokenmetadata.geoTag}</td>
                                <td>{item.tokenmetadata.weatherTag}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default CoinLiquity;

