# AIPM_product 个人网站部署文档

更新时间：2026-10-02（北京时间）

## 1. 环境信息

| 项目 | 内容 |
|---|---|
| 云厂商 | 阿里云 ECS，华东1（杭州） |
| 实例 ID | `i-bp14s6wm4rxnzegll40c` |
| 规格 | `ecs.e-c1m2.large`，2 核 4 GiB，40 GiB ESSD Entry 云盘 |
| 操作系统 | Windows Server 2022 数据中心版 64 位中文版 |
| 公网 IP | `47.97.84.235`（非弹性公网 IP，释放实例后会变） |
| Web 服务 | IIS，网站目录 `C:\inetpub\wwwroot` |
| 代码仓库 | `https://github.com/heguohua/AIPM_product`（私有），分支 `main` |
| 本地目录 | `/Users/heguohua/Documents/GitHub/AIPM_product` |
| 访问地址 | http://47.97.84.235 |

网站是纯静态页面，只有 `index.html`、`css/style.css` 和 `js/main.js` 三个文件。

## 2. 网络与安全配置

### 2.1 安全组（sg-bp14s6wm4rxnzegjvzxk）入方向规则

| 端口 | 来源 | 用途 |
|---|---|---|
| TCP 80 | `0.0.0.0/0` | 网站访问（本次新增） |
| TCP 3389 | `100.104.0.0/16` | 阿里云 Workbench 远程桌面 |
| TCP 3389 | `120.229.101.30` | 本人 IP 的远程桌面 |
| TCP 22 | `120.229.101.30` | SSH（Windows 上未启用） |
| ICMP | `0.0.0.0/0` | ping |

### 2.2 Windows 防火墙

已添加入站规则 `HTTP 80`，允许 TCP 80 端口。

## 3. 首次部署步骤（已完成）

1. **安装 IIS 并放行 80 端口**：在服务器 PowerShell 中执行：
   ```powershell
   Install-WindowsFeature -Name Web-Server -IncludeManagementTools
   New-NetFirewallRule -DisplayName "HTTP 80" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
   ```
2. **安全组放行 80 端口**：在 ECS 控制台的“网络与安全组”里添加入方向规则，允许 TCP 80，来源 `0.0.0.0/0`。
3. **部署网站文件**：见第 4 节。

## 4. 更新网站的标准流程

### 4.1 本地打包（Mac）

```bash
cd /Users/heguohua/Documents/GitHub/AIPM_product
git add -A && git commit -m "更新说明" && git push
git archive --format=zip -9 -o ~/Desktop/AIPM_site.zip HEAD
```

`git archive` 只打包已提交到 Git 的文件，不会带上 `.git` 目录或本地未提交的文件。

### 4.2 上传并部署（阿里云云助手，不需要登录服务器）

1. 打开 ECS 控制台，进入“云助手”。
2. 使用 **发送文件**：选择 `AIPM_site.zip`，目标实例为 `i-bp14s6wm4rxnzegll40c`，目标目录填 `C:\Windows\Temp`，允许覆盖。
3. 使用 **发送命令**（类型选 PowerShell），在同一台实例上执行：
   ```powershell
   Remove-Item C:\inetpub\wwwroot\* -Recurse -Force -ErrorAction SilentlyContinue
   Expand-Archive C:\Windows\Temp\AIPM_site.zip C:\inetpub\wwwroot -Force
   Get-ChildItem C:\inetpub\wwwroot -Recurse | Select FullName
   Write-Host DEPLOY OK
   ```
4. 输出里出现 `DEPLOY OK` 和文件列表，说明部署成功。

备用方式：通过 Workbench 远程桌面把 zip 传到服务器，再在 PowerShell 里执行同样的解压命令（把路径换成 zip 实际所在的位置）。

### 4.3 验证

```bash
curl -s http://47.97.84.235/ | grep -o '<title>[^<]*</title>'
curl -s -o /dev/null -w "%{http_code}\n" http://47.97.84.235/css/style.css
curl -s -o /dev/null -w "%{http_code}\n" http://47.97.84.235/js/main.js
```

标题应为 `He Guohua · AI 产品经理`，两个静态文件都应返回 `200`。浏览器访问时用 Cmd+Shift+R 强制刷新，避免看到旧缓存。

## 5. 常见问题

| 现象 | 原因 | 解决办法 |
|---|---|---|
| VS Code 推送报错 `Failed to connect to 127.0.0.1 port 7890` | Git 设了代理，但代理软件 FlClash 没开 | 先打开 FlClash 再推送；或执行 `git config --global --unset http.proxy` 和 `git config --global --unset https.proxy` 取消代理（取消后国内直连 GitHub 可能很慢） |
| 外网访问 `ERR_CONNECTION_TIMED_OUT` | 安全组没有放行 80 端口 | 添加 TCP 80、来源 `0.0.0.0/0` 的入方向规则 |
| 服务器里 `http://localhost` 能打开，外网打不开 | 安全组或 Windows 防火墙挡住了 | 按第 2 节逐项检查 |
| 部署后页面没变 | 浏览器缓存，或者 zip 没有传上去 | 强制刷新；用 4.3 的命令检查标题 |
| 服务器无法从 GitHub 拉代码 | 仓库是私有的，而且国内访问 GitHub 不稳定 | 按第 4 节在本地打包后上传 |

## 6. 后续建议

1. **绑定域名**：购买域名后，因为服务器在中国大陆，必须先完成 ICP 备案（一般 1 到 3 周），再添加 A 记录指向 `47.97.84.235`，并在 IIS 里绑定域名。
2. **HTTPS**：域名生效后申请免费 SSL 证书，安全组再放行 TCP 443。
3. **固定 IP**：在实例详情页把公网 IP“转换为弹性公网 IP”，避免 IP 变化导致网站打不开。
4. **安全防护**：在控制台确认“云安全中心”（免费基础版）已启用；需要更强防护再考虑付费的“云防火墙”。远程桌面保持只对自己的 IP 和 Workbench 开放。
5. **费用提醒**：实例是按量付费，长期使用可以考虑转为包年包月。
