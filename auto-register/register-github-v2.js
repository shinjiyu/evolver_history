const puppeteer = require('puppeteer');

async function registerGitHub() {
  console.log('启动浏览器...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const mailPage = await browser.newPage();
  await mailPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // 步骤 1: 获取临时邮箱
  console.log('\n=== 步骤 1: 获取临时邮箱 ===');
  await mailPage.goto('https://www.guerrillamail.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // 获取邮箱地址
  const email = await mailPage.evaluate(() => {
    // 尝试多种方式获取
    const el1 = document.querySelector('.email');
    const el2 = document.querySelector('#email-widget');
    const el3 = document.querySelector('span.email-address');
    if (el1) return el1.textContent.trim();
    if (el2) return el2.textContent.trim();
    if (el3) return el3.textContent.trim();
    return null;
  });
  
  console.log('临时邮箱:', email);
  
  if (!email) {
    console.log('无法获取临时邮箱，退出');
    await browser.close();
    return;
  }
  
  // 步骤 2: 访问 GitHub 注册页面
  console.log('\n=== 步骤 2: 访问 GitHub 注册 ===');
  const regPage = await browser.newPage();
  await regPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  await regPage.goto('https://github.com/signup', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await regPage.screenshot({ path: 'github-step1.png' });
  
  // 填写表单
  const inputs = await regPage.$$('input');
  console.log('找到输入框:', inputs.length, '个');
  
  // 输入框 8 是邮箱
  const emailInput = inputs[8];
  // 输入框 10 是密码
  const passwordInput = inputs[10];
  // 输入框 12 可能是用户名
  const usernameInput = inputs[12];
  
  const testUsername = 'NovelBot' + Date.now().toString(36);
  const testPassword = 'AutoReg123!@#' + Date.now().toString(36);
  
  console.log('用户名:', testUsername);
  console.log('密码:', testPassword);
  console.log('邮箱:', email);
  
  // 填写邮箱
  if (emailInput) {
    await emailInput.click();
    await emailInput.type(email, { delay: 50 });
    console.log('✓ 邮箱已填写');
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  // 按回车或点击继续
  await regPage.keyboard.press('Enter');
  console.log('按回车继续');
  
  await new Promise(r => setTimeout(r, 3000));
  await regPage.screenshot({ path: 'github-step2-after-email.png' });
  
  // 检查页面变化
  const pageContent = await regPage.content();
  const hasPassword = pageContent.includes('password') || pageContent.includes('Password');
  const hasCaptcha = pageContent.includes('captcha') || pageContent.includes('h-captcha') || pageContent.includes('cf-turnstile');
  
  console.log('密码字段:', hasPassword ? '✓ 出现' : '✗ 未出现');
  console.log('验证码:', hasCaptcha ? '⚠ 检测到' : '✓ 未检测到');
  
  // 如果出现密码字段，继续填写
  if (hasPassword && !hasCaptcha) {
    const newInputs = await regPage.$$('input');
    for (let i = 0; i < newInputs.length; i++) {
      const type = await regPage.evaluate(el => el.type, newInputs[i]);
      if (type === 'password') {
        await newInputs[i].type(testPassword, { delay: 50 });
        console.log('✓ 密码已填写');
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 1000));
    await regPage.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 3000));
    await regPage.screenshot({ path: 'github-step3-after-password.png' });
  }
  
  // 步骤 3: 检查邮箱验证邮件
  console.log('\n=== 步骤 3: 检查邮箱收件 (等待 30 秒) ===');
  await mailPage.bringToFront();
  
  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 5000));
    console.log(`检查收件箱... (${(i+1)*5}秒)`);
    
    await mailPage.reload();
    await new Promise(r => setTimeout(r, 2000));
    
    // 检查邮件
    const mailContent = await mailPage.evaluate(() => {
      const mailRows = document.querySelectorAll('.mail-row, tbody tr');
      const results = [];
      mailRows.forEach(row => {
        const subject = row.querySelector('.subject, td:nth-child(3)');
        if (subject) {
          results.push(subject.textContent.trim());
        }
      });
      return results;
    });
    
    console.log('收件箱邮件:', mailContent);
    
    if (mailContent.some(m => m.toLowerCase().includes('github') || m.toLowerCase().includes('verify'))) {
      console.log('✓ 收到验证邮件!');
      await mailPage.screenshot({ path: 'inbox-received.png' });
      
      // 点击邮件
      const mailRow = await mailPage.$('.mail-row, tbody tr');
      if (mailRow) {
        await mailRow.click();
        await new Promise(r => setTimeout(r, 2000));
        await mailPage.screenshot({ path: 'email-content.png' });
        
        // 尝试获取验证链接
        const verifyLink = await mailPage.evaluate(() => {
          const links = document.querySelectorAll('a');
          for (const link of links) {
            if (link.href.includes('github') && (link.href.includes('verify') || link.href.includes('confirm'))) {
              return link.href;
            }
          }
          return null;
        });
        
        if (verifyLink) {
          console.log('验证链接:', verifyLink);
          await regPage.goto(verifyLink, { waitUntil: 'networkidle2', timeout: 30000 });
          await regPage.screenshot({ path: 'github-verified.png' });
        }
      }
      break;
    }
  }
  
  await browser.close();
  console.log('\n=== 注册测试完成 ===');
  console.log('如果看到验证邮件，说明注册流程可行');
}

registerGitHub().catch(e => {
  console.error('错误:', e.message);
  console.error(e.stack);
  process.exit(1);
});
