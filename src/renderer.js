let baseStrings = new Map()
let translationStrings = new Map()

document.addEventListener('DOMContentLoaded', () => {
    // 文件输入处理
    document.getElementById('templateFile').addEventListener('change', async (e) => {
        const file = e.target.files[0]
        const content = await window.electronAPI.readFile(file.path)
        const result = parseXAML(content)
        baseStrings = result
        document.getElementById("translationFile").disabled = false
    })

    document.getElementById('translationFile').addEventListener('change', async (e) => {
        const file = e.target.files[0]
        const content = await window.electronAPI.readFile(file.path)
        const result = parseXAML(content)
        translationStrings = result
        generateTable()
        document.getElementById("exportBtn").disabled = false
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
            alert(`文件已保存至：${savedPath}`)
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
        <td class="translationText ${inNoTrans}">${value}</td>
        <td><input type="text" 
                  class="translationText"
                  data-key="${key}"
                  value="${translationStrings.get(key) || ''}"
                  style="width:100% size:30px"></td>
    </tr>`;
    }

    html += "</table>";
    document.getElementById("translationTable").innerHTML = html;
    document.getElementById("editor").style.display = 'block';
}