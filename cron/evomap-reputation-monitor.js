#!/usr/bin/env node
/**
 * EvoMap 信誉监控任务
 * 频率: 每 12 小时
 * 功能: 监控信誉变化、排名趋势、记录历史数据
 */

const https = require('https');
const fs = require('fs');

const LOG_FILE = '/root/.openclaw/workspace/logs/evomap-reputation.log';
const CREDENTIALS_FILE = '/root/.openclaw/workspace/memory/evomap-operation-plan/node-credentials.json';
const HISTORY_FILE = '/root/.openclaw/workspace/memory/evomap-reputation-history.json';

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logLine);
}

// 读取节点凭证
function getCredentials() {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
}

// 读取历史数据
function getHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return { records: [], alerts: [] };
  }
  return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
}

// 保存历史数据
function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// 获取节点状态
function fetchNodeStatus(credentials) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'evomap.ai',
      port: 443,
      path: `/a2a/nodes/${credentials.node_id}`,
      method: 'GET',
      headers: {
        'X-Node-ID': credentials.node_id
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('Invalid response: ' + body));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// 获取节点列表（用于排名）
function fetchNodesList(credentials) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'evomap.ai',
      port: 443,
      path: '/a2a/nodes?limit=100',
      method: 'GET',
      headers: {
        'X-Node-ID': credentials.node_id
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(body);
            resolve(result.nodes || result || []);
          } catch (e) {
            reject(new Error('Invalid response: ' + body));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// 主函数
async function main() {
  log('═══════════════════════════════════════════');
  log('  EvoMap 信誉监控任务');
  log('═══════════════════════════════════════════');
  
  // 检查凭证
  const credentials = getCredentials();
  if (!credentials) {
    log('❌ 未找到节点凭证，请先注册节点');
    process.exit(1);
  }
  
  log(`节点: ${credentials.node_id}`);
  log(`别名: ${credentials.alias || 'N/A'}`);
  
  // 读取历史数据
  const history = getHistory();
  
  // 获取当前状态
  log('\n正在获取节点状态...\n');
  
  try {
    const status = await fetchNodeStatus(credentials);
    
    log('节点状态:');
    log(`  信誉: ${status.reputation || 'N/A'}`);
    log(`  GDI 分数: ${status.gdi_score || 'N/A'}`);
    log(`  资产数量: ${status.asset_count || 0}`);
    log(`  调用次数: ${status.call_count || 0}`);
    log(`  状态: ${status.status || 'Unknown'}`);
    
    // 记录历史
    const record = {
      timestamp: new Date().toISOString(),
      reputation: status.reputation,
      gdi_score: status.gdi_score,
      asset_count: status.asset_count,
      call_count: status.call_count,
      rank: null
    };

    // 获取排名
    try {
      const nodesList = await fetchNodesList(credentials);
      const myRank = nodesList.findIndex(n => n.node_id === credentials.node_id || n.id === credentials.node_id) + 1;

      if (myRank > 0) {
        log(`  排名: #${myRank} / ${nodesList.length}`);
        record.rank = myRank;
      } else {
        log(`  排名: 未上榜`);
      }
    } catch (rankError) {
      log(`  排名: 获取失败 (${rankError.message})`);
    }
    
    history.records.push(record);
    
    // 保留最近 30 天数据
    if (history.records.length > 60) { // 每 12 小时一次，30 天 = 60 次
      history.records = history.records.slice(-60);
    }
    
    // 分析趋势
    if (history.records.length >= 2) {
      const prev = history.records[history.records.length - 2];
      const curr = record;
      
      log('\n趋势分析:');
      
      // 信誉变化
      if (prev.reputation && curr.reputation) {
        const repChange = curr.reputation - prev.reputation;
        const repTrend = repChange > 0 ? '↑' : repChange < 0 ? '↓' : '→';
        log(`  信誉: ${repTrend} ${repChange > 0 ? '+' : ''}${repChange}`);
        
        // 告警
        if (repChange <= -5) {
          log(`  ⚠️  警告: 信誉下降 ${Math.abs(repChange)} 点`);
          history.alerts.push({
            timestamp: new Date().toISOString(),
            type: 'reputation_drop',
            value: repChange
          });
        }
      }
      
      // 排名变化
      if (prev.rank && curr.rank) {
        const rankChange = prev.rank - curr.rank; // 正数表示上升
        const rankTrend = rankChange > 0 ? '↑' : rankChange < 0 ? '↓' : '→';
        log(`  排名: ${rankTrend} ${rankChange > 0 ? '+' : ''}${rankChange}`);
        
        // 告警
        if (rankChange <= -5) {
          log(`  ⚠️  警告: 排名下降 ${Math.abs(rankChange)} 位`);
          history.alerts.push({
            timestamp: new Date().toISOString(),
            type: 'rank_drop',
            value: rankChange
          });
        }
      }
      
      // 资产增长
      if (prev.asset_count && curr.asset_count) {
        const assetChange = curr.asset_count - prev.asset_count;
        log(`  资产: +${assetChange} 个`);
      }
    }
    
    // 保存历史
    saveHistory(history);
    
    // 显示统计
    log('\n历史统计:');
    log(`  记录数: ${history.records.length}`);
    log(`  告警数: ${history.alerts.length}`);
    
    if (history.records.length >= 7) {
      const recent = history.records.slice(-7);
      const avgRep = recent.reduce((sum, r) => sum + (r.reputation || 0), 0) / recent.length;
      log(`  近 7 天平均信誉: ${avgRep.toFixed(1)}`);
    }
    
  } catch (error) {
    log(`❌ 获取节点状态失败: ${error.message}`);
  }
  
  log('\n═══════════════════════════════════════════');
  log('  信誉监控任务完成');
  log('═══════════════════════════════════════════\n');
}

main().catch(error => {
  log(`❌ 任务执行失败: ${error.message}`);
  process.exit(1);
});
