let baseStrings = new Map()
let translationStrings = new Map()

document.addEventListener('DOMContentLoaded', async () => {
    // 获取历史记录
    const config = await window.electronAPI.getConfig()

    // 自动加载模板文件
    if (config.lastTemplate) {
        try {
            const content = await window.electronAPI.readFile(config.lastTemplate)
            baseStrings = parseXAML(content)
            document.getElementById("translationFile").disabled = false
            document.querySelector('#templateFile').dataset.path = config.lastTemplate
            document.getElementById('templatePath').textContent = `已加载: ${config.lastTemplate}`
        } catch {
            console.log('上次的模板文件已不存在')
        }
    }

    // 自动加载翻译文件
    if (config.lastTranslation) {
        try {
            const content = await window.electronAPI.readFile(config.lastTranslation)
            await window.electronAPI.setTranslationPath(config.lastTranslation)
            translationStrings = parseXAML(content)
            generateTable()
            document.getElementById("exportBtn").disabled = false
            document.querySelector('#translationFile').dataset.path = config.lastTranslation
            document.getElementById('translationPath').textContent = `已加载: ${config.lastTranslation}`
        } catch(e) {
            console.log('上次的翻译文件已不存在')
            console.log(e);
        }
    }

    // 文件选择处理（新增保存路径）
    document.getElementById('templateFile').addEventListener('change', async (e) => {
        const file = e.target.files[0]
        const config = await window.electronAPI.getConfig()
        config.lastTemplate = file.path
        await window.electronAPI.saveConfig(config)
        const content = await window.electronAPI.readFile(file.path)
        const result = parseXAML(content)
        baseStrings = result
        document.getElementById("translationFile").disabled = false
    })

    document.getElementById('translationFile').addEventListener('change', async (e) => {
        const file = e.target.files[0]
        const config = await window.electronAPI.getConfig()
        config.lastTranslation = file.path
        await window.electronAPI.saveConfig(config)
        const content = await window.electronAPI.readFile(file.path)
        await window.electronAPI.setTranslationPath(file.path)
        const result = parseXAML(content)
        translationStrings = result
        generateTable()
        document.getElementById("exportBtn").disabled = false
    })

    window.electronAPI.onSaveFileClick(() => {
        document.getElementById('exportBtn').click()
    })

    // 导出按钮处理
    document.getElementById('exportBtn').addEventListener('click', async () => {
    const inputs = document.querySelectorAll('input[data-key]')
    const translations = new Map()
    inputs.forEach(i => translations.set(i.dataset.key, i.value))

    let xaml = `<ResourceDictionary
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:system="clr-namespace:System;assembly=mscorlib">\n`

    for (let [key, { rawXML }] of baseStrings) {
        const tr = translations.get(key) || ''
        // 只替换 >…</system:String> 之间的内容
        const newXML = rawXML.replace(
            />([\s\S]*?)<\/system:String>/,
            `>${tr}</system:String>`
        )
        xaml += `    ${newXML}\n`
    }

    xaml += `</ResourceDictionary>`
    const savedPath = await window.electronAPI.saveFile(xaml)
    if (savedPath) showMessageDialog(`文件已保存至：${savedPath}`)
  })
})

// 修改后的 XAML 解析函数
function parseXAML(content) {
    const regex = /<system:String\b([\s\S]*?)>([\s\S]*?)<\/system:String>/g
    const result = new Map()
    let match
    while (match = regex.exec(content)) {
        const attrText = match[1]       // 包含所有属性，但不包含 xmlns:*（因为在 root 定义）
        const inner = match[2]        // 原始文本内容，保留所有实体如 &#x000A;
        const keyMatch = /x:Key="([^"]+)"/.exec(attrText)
        if (!keyMatch) continue
        const key = keyMatch[1]
        // rawXML 保留原始开/结束标签和 inner
        const rawXML = `<system:String${attrText}>${inner}</system:String>`
        result.set(key, { inner, rawXML })
    }
    return result
}


// 生成翻译表格
function generateTable() {
    let html = `
        <table>
        <tr><th class="key">键名</th><th class="translation">原内容</th><th class="translation">翻译内容</th></tr>`
    for (let [key, { inner }] of baseStrings) {
        let hasTrans = ''
        if(translationStrings.get(key)){
            hasTrans = translationStrings.get(key).inner
        }
        const cls = (!hasTrans || hasTrans === '') ? 'noTranslation' : ''
        if(inner.includes('&#x000A')) console.log(inner);
        html += `
            <tr>
                <td>${key}</td>
                <td class="translationText originalText ${cls}" id="text-${key.replace(/\./g, '-')}">
                    <span>${inner.replace('&','&amp;')}</span>
                    <button class="copyBtn" onclick="copyToClipboard('${key.replace(/\./g, '-')}')" title="复制文本">📋</button>
                </td>
                <td>
                    <input class="translationText" type="text" data-key="${key}"
                            value="${hasTrans || ''}"
                            style="width:100%"
                            keyName="${key.replace(/\./g, '-')}"
                            onchange="inputChange(this)">
                </td>
            </tr>`
    }
    html += `</table>`
    document.getElementById("translationTable").innerHTML = html
    document.getElementById("editor").style.display = 'block'
    countNoTranslations()
}

function inputChange(obj) {
    console.log(obj.getAttribute('keyName'));
    if (obj.value == '') {
        document.getElementById(`text-${obj.getAttribute('keyName')}`).classList.add('noTranslation')
    } else {
        document.getElementById(`text-${obj.getAttribute('keyName')}`).classList.remove('noTranslation')
    }
    countNoTranslations()
}

function countNoTranslations() {
    let noNum = document.getElementsByClassName('noTranslation').length
    let total = document.getElementsByClassName('originalText').length
    console.log(document.getElementsByClassName('noTranslation').length);

    document.getElementById('noTranslationNum').innerHTML = noNum
    document.getElementById('totalNum').innerHTML = total
}

function copyToClipboard(keyName) {
    const textElement = document.getElementById(`text-${keyName}`)
    const text = textElement.querySelector('span').textContent
    navigator.clipboard.writeText(text).then(() => {
        // 临时显示反馈
        const btn = event.target
        const originalText = btn.textContent
        btn.textContent = '✓'
        setTimeout(() => {
            btn.textContent = originalText
        }, 1500)
    }).catch(err => {
        console.error('复制失败:', err)
    })
}