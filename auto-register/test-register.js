const puppeteer = require('puppeteer');

async function testRegister() {
  console.log('启动浏览器...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // 测试 1: Reddit 注册页面
  console.log('\n=== 测试 Reddit 注册 ===');
  try {
    await page.goto('https://www.reddit.com/register/', { waitUntil: 'networkidle2', timeout: 30000 });
    const title = await page.title();
    console.log('页面标题:', title);
    
    // 截图
    await page.screenshot({ path: 'reddit-register.png' });
    console.log('截图保存: reddit-register.png');
    
    // 检查表单元素
    const emailInput = await page.$('input[name="email"]');
    const passwordInput = await page.$('input[name="password"]');
    const usernameInput = await page.$('input[name="username"]');
    
    console.log('邮箱输入框:', emailInput ? '✓ 存在' : '✗ 不存在');
    console.log('密码输入框:', passwordInput ? '✓ 存在' : '✗ 不存在');
    console.log('用户名输入框:', usernameInput ? '✓ 存在' : '✗ 不存在');
    
  } catch (e) {
    console.log('Reddit 访问失败:', e.message);
  }
  
  // 测试 2: Medium 注册页面
  console.log('\n=== 测试 Medium 注册 ===');
  try {
    await page.goto('https://medium.com/m/signin', { waitUntil: 'networkidle2', timeout: 30000 });
    const title = await page.title();
    console.log('页面标题:', title);
    await page.screenshot({ path: 'medium-register.png' });
    console.log('截图保存: medium-register.png');
    
    // 检查是否有邮箱注册选项
    const pageContent = await page.content();
    const hasEmailSignup = pageContent.includes('email') || pageContent.includes('Email');
    console.log('邮箱注册选项:', hasEmailSignup ? '✓ 可能存在' : '✗ 未找到');
    
  } catch (e) {
    console.log('Medium 访问失败:', e.message);
  }
  
  // 测试 3: GitHub 注册页面
  console.log('\n=== 测试 GitHub 注册 ===');
  try {
    await page.goto('https://github.com/signup', { waitUntil: 'networkidle2', timeout: 30000 });
    const title = await page.title();
    console.log('页面标题:', title);
    await page.screenshot({ path: 'github-register.png' });
    console.log('截图保存: github-register.png');
    
    // 检查验证码
    const hasCaptcha = await page.$('iframe[src*="captcha"]') || await page.$('.captcha');
    console.log('验证码:', hasCaptcha ? '⚠ 存在' : '✓ 未检测到');
    
  } catch (e) {
    console.log('GitHub 访问失败:', e.message);
  }
  
  // 测试 4: 临时邮箱网站
  console.log('\n=== 测试临时邮箱 ===');
  try {
    await page.goto('https://www.guerrillamail.com/', { waitUntil: 'networkidle2', timeout: 30000 });
    const title = await page.title();
    console.log('页面标题:', title);
    await page.screenshot({ path: 'temp-mail.png' });
    console.log('截图保存: temp-mail.png');
    
    // 尝试获取邮箱地址
    const emailElement = await page.$('.email, #email-widget');
    if (emailElement) {
      const email = await page.evaluate(el => el.textContent, emailElement);
      console.log('临时邮箱地址:', email);
    }
    
  } catch (e) {
    console.log('临时邮箱访问失败:', e.message);
  }
  
  await browser.close();
  console.log('\n=== 测试完成 ===');
}

testRegister().catch(console.error);
