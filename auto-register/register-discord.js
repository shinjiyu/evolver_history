const puppeteer = require('puppeteer');

async function registerDiscord() {
  console.log('启动浏览器...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  
  // 步骤 1: 获取临时邮箱
  console.log('\n=== 步骤 1: 获取临时邮箱 ===');
  const mailPage = await browser.newPage();
  await mailPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  await mailPage.goto('https://www.guerrillamail.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const email = await mailPage.evaluate(() => {
    const el = document.querySelector('.email') || document.querySelector('span.email-address');
    return el ? el.textContent.trim() : null;
  });
  
  console.log('临时邮箱:', email);
  
  if (!email) {
    console.log('❌ 无法获取临时邮箱');
    await browser.close();
    return { success: false, error: 'No temp email' };
  }
  
  // 步骤 2: 访问 Discord 注册页面
  console.log('\n=== 步骤 2: Discord 注册 ===');
  const discordPage = await browser.newPage();
  await discordPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // 设置视口
  await discordPage.setViewport({ width: 1280, height: 800 });
  
  await discordPage.goto('https://discord.com/register', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));
  await discordPage.screenshot({ path: 'discord-step1.png' });
  
  // 填写表单
  const testUsername = 'NovelBot' + Date.now().toString(36).substring(0, 6);
  const testPassword = 'AutoReg123!@#' + Math.random().toString(36).substring(2, 8);
  
  console.log('用户名:', testUsername);
  console.log('密码:', testPassword);
  console.log('邮箱:', email);
  
  // 尝试填写表单
  try {
    // Discord 的表单可能有不同的结构
    // 方式1: 查找所有 input
    const inputs = await discordPage.$$('input');
    console.log('找到输入框:', inputs.length, '个');
    
    for (let i = 0; i < inputs.length; i++) {
      const info = await discordPage.evaluate(el => ({
        type: el.type,
        name: el.name,
        placeholder: el.placeholder,
        id: el.id,
        ariaLabel: el.getAttribute('aria-label')
      }), inputs[i]);
      console.log(`输入框 ${i}:`, info);
    }
    
    // 填写邮箱
    const emailInput = await discordPage.$('input[type="email"]') || 
                       await discordPage.$('input[name="email"]') ||
                       await discordPage.$('input[placeholder*="Email"]') ||
                       await discordPage.$('input[placeholder*="email"]');
    
    if (emailInput) {
      await emailInput.click();
      await emailInput.type(email, { delay: 30 });
      console.log('✓ 邮箱已填写');
    } else {
      console.log('❌ 未找到邮箱输入框');
    }
    
    // 填写用户名
    const usernameInput = await discordPage.$('input[name="username"]') ||
                          await discordPage.$('input[placeholder*="Username"]') ||
                          await discordPage.$('input[placeholder*="用户名"]');
    
    if (usernameInput) {
      await usernameInput.click();
      await usernameInput.type(testUsername, { delay: 30 });
      console.log('✓ 用户名已填写');
    } else {
      console.log('❌ 未找到用户名输入框');
    }
    
    // 填写密码
    const passwordInput = await discordPage.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.click();
      await passwordInput.type(testPassword, { delay: 30 });
      console.log('✓ 密码已填写');
    } else {
      console.log('❌ 未找到密码输入框');
    }
    
    // 生日 (Discord 要求)
    // 通常有月/日/年的下拉菜单
    const monthSelect = await discordPage.$('select[name="month"]') || 
                        await discordPage.$('#month') ||
                        await discordPage.$('select[id*="month"]');
    
    if (monthSelect) {
      await monthSelect.select('01'); // 1月
      console.log('✓ 生日月份已选择');
    }
    
    const daySelect = await discordPage.$('select[name="day"]') || 
                      await discordPage.$('#day') ||
                      await discordPage.$('select[id*="day"]');
    
    if (daySelect) {
      await daySelect.select('15'); // 15日
      console.log('✓ 生日日期已选择');
    }
    
    const yearSelect = await discordPage.$('select[name="year"]') || 
                       await discordPage.$('#year') ||
                       await discordPage.$('select[id*="year"]');
    
    if (yearSelect) {
      await yearSelect.select('1995'); // 1995年
      console.log('✓ 生日年份已选择');
    }
    
    await discordPage.screenshot({ path: 'discord-step2-filled.png' });
    
    // 点击继续按钮
    const continueBtn = await discordPage.$('button[type="submit"]') ||
                        await discordPage.$('button.continue') ||
                        await discordPage.$('button:has-text("Continue")') ||
                        await discordPage.$('button:has-text("继续")');
    
    if (continueBtn) {
      await continueBtn.click();
      console.log('✓ 点击继续按钮');
      await new Promise(r => setTimeout(r, 5000));
      await discordPage.screenshot({ path: 'discord-step3-after-submit.png' });
    }
    
    // 检查是否有验证码或其他提示
    const pageContent = await discordPage.content();
    const hasCaptcha = pageContent.includes('captcha') || pageContent.includes('h-captcha') || pageContent.includes('cf-turnstile');
    const hasError = pageContent.includes('error') || pageContent.includes('invalid') || pageContent.includes('already');
    
    console.log('验证码:', hasCaptcha ? '⚠ 检测到' : '✓ 未检测到');
    console.log('错误提示:', hasError ? '⚠ 有' : '✓ 无');
    
    // 步骤 3: 检查邮箱验证
    if (!hasCaptcha) {
      console.log('\n=== 步骤 3: 检查邮箱验证 (等待 60 秒) ===');
      await mailPage.bringToFront();
      
      for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 5000));
        console.log(`检查收件箱... (${(i+1)*5}秒)`);
        
        await mailPage.reload();
        await new Promise(r => setTimeout(r, 2000));
        
        const mailContent = await mailPage.evaluate(() => {
          const rows = document.querySelectorAll('.mail-row, tbody tr');
          const results = [];
          rows.forEach(row => {
            const subject = row.querySelector('.subject, td:nth-child(3)');
            if (subject) {
              results.push(subject.textContent.trim());
            }
          });
          return results;
        });
        
        console.log('收件箱邮件:', mailContent);
        
        if (mailContent.some(m => m.toLowerCase().includes('discord') || m.toLowerCase().includes('verify'))) {
          console.log('✓ 收到验证邮件!');
          await mailPage.screenshot({ path: 'discord-inbox-received.png' });
          
          // 点击邮件查看内容
          const mailRow = await mailPage.$('.mail-row, tbody tr');
          if (mailRow) {
            await mailRow.click();
            await new Promise(r => setTimeout(r, 2000));
            await mailPage.screenshot({ path: 'discord-email-content.png' });
            
            // 尝试获取验证链接
            const verifyLink = await mailPage.evaluate(() => {
              const links = document.querySelectorAll('a');
              for (const link of links) {
                if (link.href.includes('discord') && (link.href.includes('verify') || link.href.includes('confirm'))) {
                  return link.href;
                }
              }
              return null;
            });
            
            if (verifyLink) {
              console.log('✓ 验证链接:', verifyLink);
              
              // 访问验证链接
              await discordPage.goto(verifyLink, { waitUntil: 'networkidle2', timeout: 30000 });
              await new Promise(r => setTimeout(r, 3000));
              await discordPage.screenshot({ path: 'discord-verified.png' });
              
              console.log('\n🎉 Discord 注册成功!');
              console.log('邮箱:', email);
              console.log('用户名:', testUsername);
              console.log('密码:', testPassword);
              
              // 保存账号信息
              const fs = require('fs');
              fs.writeFileSync('discord-account.json', JSON.stringify({
                email,
                username: testUsername,
                password: testPassword,
                createdAt: new Date().toISOString()
              }, null, 2));
              
              await browser.close();
              return { success: true, email, username: testUsername, password: testPassword };
            }
          }
          break;
        }
      }
    }
    
  } catch (e) {
    console.log('❌ 注册过程出错:', e.message);
    await discordPage.screenshot({ path: 'discord-error.png' });
  }
  
  await browser.close();
  console.log('\n=== 注册测试完成 ===');
  return { success: false };
}

registerDiscord().then(result => {
  if (result.success) {
    console.log('\n✅ 注册成功!');
  } else {
    console.log('\n❌ 注册未完成');
  }
}).catch(e => {
  console.error('错误:', e.message);
  process.exit(1);
});
