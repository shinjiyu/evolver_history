const puppeteer = require('puppeteer');

async function registerGitHub() {
  console.log('启动浏览器...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // 步骤 1: 获取临时邮箱
  console.log('\n=== 步骤 1: 获取临时邮箱 ===');
  await page.goto('https://www.guerrillamail.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // 等待邮箱地址加载
  await page.waitForSelector('.email, #email-widget', { timeout: 10000 });
  const email = await page.evaluate(() => {
    const el = document.querySelector('.email') || document.querySelector('#email-widget');
    return el ? el.textContent.trim() : null;
  });
  
  if (!email) {
    // 尝试其他选择器
    const email2 = await page.$eval('input#email-widget', el => el.value).catch(() => null);
    const email3 = await page.$eval('.inbox-email', el => el.textContent).catch(() => null);
    console.log('尝试获取邮箱:', email2 || email3);
  }
  
  console.log('临时邮箱:', email);
  
  // 步骤 2: 访问 GitHub 注册页面
  console.log('\n=== 步骤 2: 访问 GitHub 注册 ===');
  const registerPage = await browser.newPage();
  await registerPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  await registerPage.goto('https://github.com/signup', { waitUntil: 'networkidle2', timeout: 30000 });
  await registerPage.screenshot({ path: 'github-step1.png' });
  
  // 填写邮箱
  console.log('填写邮箱:', email);
  const emailInput = await registerPage.$('input[name="email"]');
  if (emailInput) {
    await emailInput.type(email);
    await registerPage.screenshot({ path: 'github-step2-email.png' });
    
    // 点击继续
    const continueBtn = await registerPage.$('button[type="submit"], button.continue-button');
    if (continueBtn) {
      await continueBtn.click();
      console.log('点击继续按钮');
      await registerPage.waitForTimeout(3000);
      await registerPage.screenshot({ path: 'github-step3-after-email.png' });
    }
  } else {
    console.log('未找到邮箱输入框，尝试其他选择器...');
    
    // 尝试查找任何输入框
    const inputs = await registerPage.$$('input');
    console.log('找到输入框数量:', inputs.length);
    
    for (let i = 0; i < inputs.length; i++) {
      const type = await registerPage.evaluate(el => el.type || el.name || el.placeholder, inputs[i]);
      console.log(`输入框 ${i}:`, type);
    }
  }
  
  // 步骤 3: 检查邮箱收件
  console.log('\n=== 步骤 3: 检查邮箱收件 ===');
  await page.bringToFront();
  await page.waitForTimeout(5000);
  
  // 刷新邮箱
  await page.reload();
  await page.waitForTimeout(3000);
  
  // 检查是否有新邮件
  const emails = await page.$$('.email-item, tr.mail-row');
  console.log('收件箱邮件数:', emails.length);
  
  await page.screenshot({ path: 'inbox-check.png' });
  
  // 输出当前页面内容（调试）
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n收件箱内容预览:');
  console.log(bodyText.substring(0, 500));
  
  await browser.close();
  console.log('\n=== 测试完成 ===');
}

registerGitHub().catch(e => {
  console.error('错误:', e.message);
  process.exit(1);
});
