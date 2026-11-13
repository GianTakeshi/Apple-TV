function main(config) {
  // === 自定义代理网站列表 ===
  const customProxyUrls = [
    "https://clash.md/",
    "https://ip.net.coffee/",
    "www.cloudflare.com"
  ];

  // === 自动筛选四个地区节点（支持 US01、US-01、US 01 等命名格式） ===
  const allNodes = [...new Set(
    (config.proxies ?? [])
      .map(proxy => proxy.name)
      .filter(name => /(?:^|[\s\-_])(?:US|SG|JP|TW)[-_ ]?\d+/i.test(name))
  )];

  // === 创建 Siri AI 代理组 ===
  config["proxy-groups"] ??= [];

  const plusExists = config["proxy-groups"].some(
    item => item.name === "Plus Advantage"
  );

  const siriNodes = [...new Set([
    ...(plusExists ? ["Plus Advantage"] : []),
    ...allNodes
  ])];

  // 删除旧 Siri AI 代理组
  config["proxy-groups"] = config["proxy-groups"].filter(
    item => item.name !== "Siri AI"
  );

  // 插入新的 Siri AI 代理组至首位
  config["proxy-groups"].unshift({
    name: "Siri AI",
    type: "select",
    proxies: siriNodes.length > 0 ? siriNodes : ["DIRECT"]
  });

  // === Siri AI 分流规则 ===
  const customRules = [
    // 国内服务直连（保证本地定位与 Apple 国内 CDN 加速）
    "DOMAIN-SUFFIX,snssdk.com,DIRECT",
    "DOMAIN-SUFFIX,apps.mzstatic.com,DIRECT",
    "DOMAIN-SUFFIX,amap.com,DIRECT",
    "DOMAIN-SUFFIX,autonavi.com,DIRECT",
    "DOMAIN-SUFFIX,amapauto.com,DIRECT",
    "DOMAIN-KEYWORD,ssl-cn.ls.apple.com,DIRECT",
    "DOMAIN-KEYWORD,cn-ssl.ls.apple.com,DIRECT",
    "DOMAIN-SUFFIX,gs-loc-cn.apple.com,DIRECT",
    "DOMAIN-SUFFIX,ls-cn.apple.com,DIRECT",

    // Siri AI & Apple Relay 代理
    "DOMAIN,api.ip.sb,Siri AI",
    "DOMAIN-SUFFIX,guzzoni.apple.com,Siri AI",
    "DOMAIN-SUFFIX,smoot.apple.com,Siri AI",
    "DOMAIN-SUFFIX,siri.apple.com,Siri AI",
    "DOMAIN-SUFFIX,api-siri-prod.apple.com,Siri AI",
    "DOMAIN-SUFFIX,apple-relay.apple.com,Siri AI",
    "DOMAIN-SUFFIX,apple-relay.cloudflare.com,Siri AI",
    "DOMAIN-SUFFIX,apple-carry-relay.cloudflare.com,Siri AI",
    "DOMAIN-SUFFIX,apple-relay.fastly-edge.com,Siri AI",
    "DOMAIN-SUFFIX,apple-relay.akamaized.net,Siri AI",
    "DOMAIN-SUFFIX,apple-relay.mask.apple-dns.net,Siri AI",
    "DOMAIN-SUFFIX,cp4.cloudflare.com,Siri AI",
    "DOMAIN-SUFFIX,mask.icloud.com,Siri AI",
    "DOMAIN-SUFFIX,mask-h2.icloud.com,Siri AI",
    "DOMAIN-SUFFIX,mask-api.icloud.com,Siri AI",
    "DOMAIN-SUFFIX,mask.apple-dns.net,Siri AI",
    "DOMAIN-SUFFIX,mask-t.apple-dns.net,Siri AI",
    "DOMAIN-SUFFIX,mask-api.fe.apple-dns.net,Siri AI",
    "DOMAIN-SUFFIX,mask-api.fe2.apple-dns.net,Siri AI",
    "DOMAIN-SUFFIX,ls.apple.com,Siri AI",
    "DOMAIN-SUFFIX,gateway.icloud.com,Siri AI",
    "DOMAIN-SUFFIX,probe.icloud.com,Siri AI",
    "DOMAIN-SUFFIX,metrics.icloud.com,Siri AI",
    "DOMAIN-SUFFIX,wps.apple.com,Siri AI",
    "DOMAIN-SUFFIX,apple-intelligence.apple.com,Siri AI",
    "DOMAIN-SUFFIX,issuer.apple.com,Siri AI",
    "DOMAIN-SUFFIX,ropes.apple.com,Siri AI",
    "DOMAIN-SUFFIX,gateway-oblivious.apple.com,Siri AI"
  ];

  // === 自定义域名自动加入代理 ===
  const urlRules = customProxyUrls
    .map(url => {
      const host = url.trim()
        .replace(/^[a-zA-Z]+:\/\//, "")
        .split("/")[0]
        .split(":")[0];

      return host ? ("DOMAIN-SUFFIX," + host + ",Siri AI") : null;
    })
    .filter(Boolean);

  customRules.push(...urlRules);

  // === 幂等性更新规则：清理所有历史注入的规则（包括 Siri AI 和上面指定的直连规则） ===
  config.rules ??= [];
  const customRuleSet = new Set(customRules);

  config.rules = config.rules.filter(rule =>
    !rule.endsWith(",Siri AI") && !customRuleSet.has(rule)
  );

  // 插入到最前列优先命中
  config.rules.unshift(...customRules);

  return config;
}
