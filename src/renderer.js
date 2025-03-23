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
        } catch {
            console.log('上次的翻译文件已不存在')
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

    window.electronAPI.onSaveFileClick(()=>{
        document.getElementById('exportBtn').click()
    })

    // 导出按钮处理
    document.getElementById('exportBtn').addEventListener('click', async () => {
        const inputs = document.querySelectorAll('input[data-key]')
        const translations = new Map()
        inputs.forEach(input => {
            translations.set(input.dataset.key, input.value)
        })

        let xaml = `<ResourceDictionary
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:system="clr-namespace:System;assembly=mscorlib">\n\n`

        for (let [key, value] of baseStrings) {
            const translation = translations.get(key) || ''
            xaml += `    <system:String x:Key="${key}">${translation}</system:String>\n`
        }

        xaml += `</ResourceDictionary>`

        const savedPath = await window.electronAPI.saveFile(xaml)
        if (savedPath) {
            showMessageDialog(`文件已保存至：${savedPath}`)
        }
    })
})

// 修改后的 XAML 解析函数
function parseXAML(content) {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(content, "text/xml")
    const strings = xmlDoc.getElementsByTagName("system:String")

    const result = new Map()
    for (let str of strings) {
        const key = str.getAttribute("x:Key")
        const value = str.textContent
        result.set(key, value)
    }
    return result
}

// 生成翻译表格
function generateTable() {
    let html = `
<table>
    <tr>
        <th class="key">键名</th>
        <th class="translation">原内容</th>
        <th class="translation">翻译内容</th>
    </tr>`;

    for (let [key, value] of baseStrings) {
        let inNoTrans = ""
        if (!translationStrings.get(key) || translationStrings.get(key) == "") inNoTrans = "noTranslation"
        html += `
    <tr>
        <td>${key}</td>
        <td class="translationText ${inNoTrans}" id="text-${key.replace(/\./g,"-")}">${value}</td>
        <td><input type="text" 
                  class="translationText"
                  data-key="${key}"
                  value="${translationStrings.get(key) || ''}"
                  style="width:100% size:30px"
                  keyName="${key.replace(/\./g,"-")}"
                  onchange="inputChange(this)"></td>
    </tr>`;
    }

    html += "</table>";
    document.getElementById("translationTable").innerHTML = html;
    document.getElementById("editor").style.display = 'block';
}

function inputChange(obj){
    console.log(obj.getAttribute('keyName'));
    if(obj.value == ''){
        document.getElementById(`text-${obj.getAttribute('keyName')}`).classList.add('noTranslation')
    }else{
        document.getElementById(`text-${obj.getAttribute('keyName')}`).classList.remove('noTranslation')
    }
}