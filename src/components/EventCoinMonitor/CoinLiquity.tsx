import React, { useEffect, useState } from "react";
import axios from "axios";
import { hierarchy, treemap } from "d3-hierarchy";

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
        axios.get("http://10.18.23.51:3000/swap/heatmap")
            .then(res => setHeatmap(res.data))
            .catch(() => setError("获取热力图数据失败"))
            .finally(() => setLoading(false));
    }, []);

    const width = 800;
    const height = 400;

    // Treemap 数据准备
    const treemapData = {
        name: "root",
        children: heatmap.map(item => ({
            name: item.tokenmetadata.fullname,
            value: item.reserve0_ratio,
            poolid: item.poolid,
            ticker: item.tokenmetadata.ticker
        }))
    };

    // Treemap 布局
    let nodes: any[] = [];
    if (heatmap.length > 0) {
        const root = hierarchy(treemapData)
            .sum((d: any) => d.value)
            .sort((a: any, b: any) => (b.value as number) - (a.value as number));
        treemap<any>()
            .size([width, height])
            .padding(2)(root);
        nodes = root.leaves();
    }

    return (
        <div>
            <h3>池热力图</h3>
            {loading && <div>加载中...</div>}
            {error && <div style={{color: 'red'}}>{error}</div>}
            {!loading && !error && (
                <svg width={width} height={height} style={{ border: "1px solid #ccc", marginTop: 12 }}>
                    {nodes.map((node, idx) => (
                        <g key={node.data.poolid}>
                            <rect
                                x={node.x0}
                                y={node.y0}
                                width={node.x1 - node.x0}
                                height={node.y1 - node.y0}
                                fill={`hsl(${idx * 60},70%,70%)`}
                                stroke="#fff"
                            />
                            <text
                                x={(node.x0 + node.x1) / 2}
                                y={(node.y0 + node.y1) / 2}
                                textAnchor="middle"
                                alignmentBaseline="middle"
                                fontSize={16}
                                fill="#333"
                            >
                                {node.data.name} ({(node.data.value * 100).toFixed(1)}%)
                            </text>
                        </g>
                    ))}
                </svg>
            )}
        </div>
    );
};

export default CoinLiquity;
