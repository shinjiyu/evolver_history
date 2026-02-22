const puppeteer = require('puppeteer');

async function testPlatforms() {
  console.log('启动浏览器...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  // ===== 平台 1: Discord =====
  console.log('\n=== 测试 Discord 注册 ===');
  const discordPage = await browser.newPage();
  await discordPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    await discordPage.goto('https://discord.com/register', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await discordPage.screenshot({ path: 'discord-register.png' });
    
    const content = await discordPage.content();
    const hasCaptcha = content.includes('captcha') || content.includes('h-captcha') || content.includes('cf-turnstile');
    const hasPhone = content.includes('phone') || content.includes('验证码');
    
    console.log('验证码:', hasCaptcha ? '⚠ 检测到' : '✓ 未检测到');
    console.log('手机验证:', hasPhone ? '⚠ 需要' : '✓ 不需要');
    
  } catch (e) {
    console.log('Discord 访问失败:', e.message);
  }
  await discordPage.close();
  
  // ===== 平台 2: Reddit =====
  console.log('\n=== 测试 Reddit 注册 ===');
  const redditPage = await browser.newPage();
  await redditPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    await redditPage.goto('https://www.reddit.com/account/register/', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await redditPage.screenshot({ path: 'reddit-register.png' });
    
    const content = await redditPage.content();
    const hasCaptcha = content.includes('captcha') || content.includes('h-captcha');
    const hasEmail = content.includes('email');
    
    console.log('验证码:', hasCaptcha ? '⚠ 检测到' : '✓ 未检测到');
    console.log('邮箱字段:', hasEmail ? '✓ 存在' : '✗ 不存在');
    
  } catch (e) {
    console.log('Reddit 访问失败:', e.message);
  }
  await redditPage.close();
  
  // ===== 平台 3: Twitter/X =====
  console.log('\n=== 测试 Twitter/X 注册 ===');
  const twitterPage = await browser.newPage();
  await twitterPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    await twitterPage.goto('https://twitter.com/i/flow/signup', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 5000));
    await twitterPage.screenshot({ path: 'twitter-register.png' });
    
    const content = await twitterPage.content();
    const hasCaptcha = content.includes('captcha') || content.includes('challenge');
    const hasPhone = content.includes('phone');
    
    console.log('验证码:', hasCaptcha ? '⚠ 检测到' : '✓ 未检测到');
    console.log('手机验证:', hasPhone ? '⚠ 需要' : '✓ 不需要');
    
  } catch (e) {
    console.log('Twitter 访问失败:', e.message);
  }
  await twitterPage.close();
  
  // ===== 平台 4: Dev.to =====
  console.log('\n=== 测试 Dev.to 注册 ===');
  const devPage = await browser.newPage();
  await devPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    await devPage.goto('https://dev.to/enter', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await devPage.screenshot({ path: 'devto-register.png' });
    
    const content = await devPage.content();
    // Dev.to 支持多种登录方式
    const hasGithub = content.includes('github');
    const hasTwitter = content.includes('twitter');
    const hasApple = content.includes('apple');
    const hasEmail = content.includes('email');
    
    console.log('GitHub 登录:', hasGithub ? '✓ 支持' : '✗ 不支持');
    console.log('Twitter 登录:', hasTwitter ? '✓ 支持' : '✗ 不支持');
    console.log('Apple 登录:', hasApple ? '✓ 支持' : '✗ 不支持');
    console.log('邮箱注册:', hasEmail ? '✓ 支持' : '✗ 不支持');
    
  } catch (e) {
    console.log('Dev.to 访问失败:', e.message);
  }
  await devPage.close();
  
  // ===== 平台 5: Hashnode (博客平台) =====
  console.log('\n=== 测试 Hashnode 注册 ===');
  const hashnodePage = await browser.newPage();
  await hashnodePage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    await hashnodePage.goto('https://hashnode.com/onboard', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await hashnodePage.screenshot({ path: 'hashnode-register.png' });
    
    const content = await hashnodePage.content();
    const hasGithub = content.includes('github');
    const hasGoogle = content.includes('google');
    const hasEmail = content.includes('email');
    
    console.log('GitHub 登录:', hasGithub ? '✓ 支持' : '✗ 不支持');
    console.log('Google 登录:', hasGoogle ? '✓ 支持' : '✗ 不支持');
    console.log('邮箱注册:', hasEmail ? '✓ 支持' : '✗ 不支持');
    
  } catch (e) {
    console.log('Hashnode 访问失败:', e.message);
  }
  await hashnodePage.close();
  
  // ===== 平台 6: Ghost.org (开源博客) =====
  console.log('\n=== 测试 Ghost 注册 ===');
  const ghostPage = await browser.newPage();
  await ghostPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    await ghostPage.goto('https://ghost.org/signup/', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await ghostPage.screenshot({ path: 'ghost-register.png' });
    
    const content = await ghostPage.content();
    const hasEmail = content.includes('email');
    const hasCaptcha = content.includes('captcha');
    
    console.log('邮箱注册:', hasEmail ? '✓ 支持' : '✗ 不支持');
    console.log('验证码:', hasCaptcha ? '⚠ 检测到' : '✓ 未检测到');
    
  } catch (e) {
    console.log('Ghost 访问失败:', e.message);
  }
  await ghostPage.close();
  
  // ===== 平台 7: Lobste.rs (技术社区) =====
  console.log('\n=== 测试 Lobste.rs 注册 ===');
  const lobstersPage = await browser.newPage();
  await lobstersPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    await lobstersPage.goto('https://lobste.rs/signup', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await lobstersPage.screenshot({ path: 'lobsters-register.png' });
    
    const content = await lobstersPage.content();
    const hasInvite = content.includes('invite') || content.includes('invitation');
    
    console.log('注册方式:', hasInvite ? '⚠ 需要邀请' : '✓ 开放注册');
    
  } catch (e) {
    console.log('Lobste.rs 访问失败:', e.message);
  }
  await lobstersPage.close();
  
  await browser.close();
  console.log('\n=== 平台测试完成 ===');
}

testPlatforms().catch(e => {
  console.error('错误:', e.message);
  process.exit(1);
});
