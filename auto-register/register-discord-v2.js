const puppeteer = require('puppeteer');

async function getTempEmail(page) {
  await page.goto('https://www.guerrillamail.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  // 尝试多种方式获取邮箱
  const email = await page.evaluate(() => {
    // 方式 1: class="email"
    const el1 = document.querySelector('.email');
    if (el1) return el1.textContent.trim();
    
    // 方式 2: id="email-widget"
    const el2 = document.querySelector('#email-widget');
    if (el2) return el2.textContent.trim();
    
    // 方式 3: span with class containing "email"
    const el3 = document.querySelector('span[class*="email"]');
    if (el3) return el3.textContent.trim();
    
    // 方式 4: input with email
    const el4 = document.querySelector('input[type="email"]');
    if (el4) return el4.value;
    
    // 方式 5: any element with text containing @
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const text = el.textContent || '';
      const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match && match[0].includes('sharklasers')) {
        return match[0];
      }
    }
    
    return null;
  });
  
  return email;
}

async function registerDiscord() {
  console.log('启动浏览器...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox'
    ]
  });
  
  // 步骤 1: 获取临时邮箱
  console.log('\n=== 步骤 1: 获取临时邮箱 ===');
  const mailPage = await browser.newPage();
  await mailPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  const email = await getTempEmail(mailPage);
  console.log('临时邮箱:', email);
  
  // 保存邮箱页面用于后续检查
  const mailSession = email;
  
  if (!email) {
    // 尝试备用临时邮箱服务
    console.log('Guerrilla Mail 失败，尝试备用服务...');
    
    try {
      await mailPage.goto('https://temp-mail.org/', { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 5000));
      
      const email2 = await mailPage.evaluate(() => {
        const input = document.querySelector('input[type="email"], input[readonly]');
        return input ? input.value : null;
      });
      
      if (email2) {
        console.log('备用邮箱:', email2);
      }
    } catch (e) {
      console.log('备用服务也失败:', e.message);
    }
  }
  
  if (!email) {
    console.log('❌ 无法获取临时邮箱');
    await browser.close();
    return { success: false, error: 'No temp email' };
  }
  
  // 步骤 2: 访问 Discord 注册页面
  console.log('\n=== 步骤 2: Discord 注册 ===');
  const discordPage = await browser.newPage();
  await discordPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await discordPage.setViewport({ width: 1280, height: 800 });
  
  await discordPage.goto('https://discord.com/register', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));
  await discordPage.screenshot({ path: 'discord-step1.png' });
  
  const testUsername = 'NovelBot' + Date.now().toString(36).substring(0, 6);
  const testPassword = 'AutoReg123!@#' + Math.random().toString(36).substring(2, 8);
  
  console.log('用户名:', testUsername);
  console.log('密码:', testPassword);
  console.log('邮箱:', email);
  
  try {
    // 分析页面结构
    console.log('\n分析页面结构...');
    const pageAnalysis = await discordPage.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      const selects = document.querySelectorAll('select');
      const buttons = document.querySelectorAll('button');
      
      return {
        inputs: Array.from(inputs).map(el => ({
          type: el.type,
          name: el.name,
          placeholder: el.placeholder,
          id: el.id,
          ariaLabel: el.getAttribute('aria-label'),
          autocomplete: el.autocomplete
        })),
        selects: Array.from(selects).map(el => ({
          name: el.name,
          id: el.id,
          options: Array.from(el.options).map(o => o.value).slice(0, 5)
        })),
        buttons: Array.from(buttons).map(el => ({
          text: el.textContent.trim().substring(0, 30),
          type: el.type
        }))
      };
    });
    
    console.log('输入框:', JSON.stringify(pageAnalysis.inputs, null, 2));
    console.log('下拉框:', JSON.stringify(pageAnalysis.selects, null, 2));
    console.log('按钮:', JSON.stringify(pageAnalysis.buttons, null, 2));
    
    // 填写表单
    let filled = { email: false, username: false, password: false };
    
    for (const input of pageAnalysis.inputs) {
      if (input.type === 'email' || input.name === 'email' || input.autocomplete === 'email') {
        const el = await discordPage.$(`input[name="${input.name}"], input[type="${input.type}"], input#${input.id}`);
        if (el) {
          await el.click();
          await el.type(email, { delay: 30 });
          console.log('✓ 邮箱已填写');
          filled.email = true;
        }
      } else if (input.type === 'password' || input.autocomplete === 'new-password') {
        const el = await discordPage.$(`input[name="${input.name}"], input[type="password"]`);
        if (el) {
          await el.click();
          await el.type(testPassword, { delay: 30 });
          console.log('✓ 密码已填写');
          filled.password = true;
        }
      } else if (input.type === 'text' && (input.name === 'username' || input.autocomplete === 'username')) {
        const el = await discordPage.$(`input[name="${input.name}"]`);
        if (el) {
          await el.click();
          await el.type(testUsername, { delay: 30 });
          console.log('✓ 用户名已填写');
          filled.username = true;
        }
      }
    }
    
    await discordPage.screenshot({ path: 'discord-step2-filled.png' });
    
    // 如果还有未填写的字段
    if (!filled.email) {
      console.log('⚠ 邮箱未填写');
    }
    if (!filled.username) {
      console.log('⚠ 用户名未填写');
    }
    if (!filled.password) {
      console.log('⚠ 密码未填写');
    }
    
    // 尝试点击继续按钮
    const submitBtn = await discordPage.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      console.log('✓ 点击提交按钮');
      await new Promise(r => setTimeout(r, 5000));
      await discordPage.screenshot({ path: 'discord-step3-after-submit.png' });
    }
    
    // 检查页面状态
    const pageContent = await discordPage.content();
    const hasCaptcha = pageContent.includes('captcha') || pageContent.includes('h-captcha') || pageContent.includes('turnstile');
    const hasError = pageContent.includes('error') || pageContent.includes('invalid') || pageContent.includes('already registered');
    
    console.log('验证码:', hasCaptcha ? '⚠ 检测到' : '✓ 未检测到');
    console.log('错误提示:', hasError ? '⚠ 有' : '✓ 无');
    
    if (hasCaptcha) {
      console.log('\n❌ Discord 需要验证码，无法自动注册');
      await browser.close();
      return { success: false, reason: 'captcha' };
    }
    
    // 步骤 3: 检查邮箱验证
    console.log('\n=== 步骤 3: 检查邮箱验证 (等待 60 秒) ===');
    await mailPage.bringToFront();
    
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 5000));
      console.log(`检查收件箱... (${(i+1)*5}秒)`);
      
      await mailPage.reload();
      await new Promise(r => setTimeout(r, 3000));
      await mailPage.screenshot({ path: `mail-check-${i}.png` });
      
      const mailContent = await mailPage.evaluate(() => {
        const rows = document.querySelectorAll('.mail-row, tbody tr, tr[class*="mail"]');
        const results = [];
        rows.forEach(row => {
          const text = row.textContent || '';
          if (text.includes('@') || text.includes('discord') || text.includes('verify')) {
            results.push(text.substring(0, 100));
          }
        });
        return results;
      });
      
      console.log('收件箱内容:', mailContent);
      
      // 检查是否有 Discord 邮件
      const hasDiscordMail = mailContent.some(m => 
        m.toLowerCase().includes('discord') || 
        m.toLowerCase().includes('verify')
      );
      
      if (hasDiscordMail) {
        console.log('✓ 收到验证邮件!');
        
        // 点击邮件
        const mailRow = await mailPage.$('.mail-row, tbody tr');
        if (mailRow) {
          await mailRow.click();
          await new Promise(r => setTimeout(r, 2000));
          await mailPage.screenshot({ path: 'discord-email-content.png' });
          
          // 获取验证链接
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
            
            await discordPage.goto(verifyLink, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));
            await discordPage.screenshot({ path: 'discord-verified.png' });
            
            console.log('\n🎉 Discord 注册成功!');
            console.log('邮箱:', email);
            console.log('用户名:', testUsername);
            console.log('密码:', testPassword);
            
            const fs = require('fs');
            fs.writeFileSync('discord-account.json', JSON.stringify({
              platform: 'discord',
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
    
    console.log('未收到验证邮件，可能需要更长时间或邮箱服务有问题');
    
  } catch (e) {
    console.log('❌ 注册过程出错:', e.message);
    await discordPage.screenshot({ path: 'discord-error.png' });
  }
  
  await browser.close();
  return { success: false };
}

registerDiscord().then(result => {
  console.log('\n=== 最终结果 ===');
  if (result.success) {
    console.log('✅ 注册成功!');
    console.log('账号信息已保存到 discord-account.json');
  } else {
    console.log('❌ 注册未完成');
    console.log('原因:', result.reason || '未知');
  }
}).catch(e => {
  console.error('错误:', e.message);
  process.exit(1);
});
