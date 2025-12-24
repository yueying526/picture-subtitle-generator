document.addEventListener('DOMContentLoaded', () => {
    // 获取 DOM 元素
    const imageInput = document.getElementById('imageInput');
    const fileNameDisplay = document.getElementById('fileName');
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // 设置项
    const sliceHeightInput = document.getElementById('sliceHeight');
    const fontSizeInput = document.getElementById('fontSize');
    const fontColorInput = document.getElementById('fontColor');
    const strokeColorInput = document.getElementById('strokeColor');
    const strokeWidthInput = document.getElementById('strokeWidth');
    const marginBottomInput = document.getElementById('marginBottom');
    const subtitleTextInput = document.getElementById('subtitleText');
    
    // 预览相关
    const previewContainer = document.getElementById('previewContainer');
    const resultCanvas = document.getElementById('resultCanvas');
    const resultImage = document.getElementById('resultImage');
    const placeholderText = document.querySelector('.placeholder-text');

    // 颜色选择器值显示同步
    const colorPickers = document.querySelectorAll('input[type="color"]');
    colorPickers.forEach(picker => {
        picker.addEventListener('input', (e) => {
            e.target.nextElementSibling.textContent = e.target.value.toUpperCase();
            triggerUpdate(); // 颜色改变时实时更新
        });
    });

    // 监听输入框变化，实时更新
    const inputs = [sliceHeightInput, fontSizeInput, strokeWidthInput, marginBottomInput];
    inputs.forEach(input => {
        input.addEventListener('input', triggerUpdate);
    });
    
    subtitleTextInput.addEventListener('input', triggerUpdate);

    let originalImage = null;

    // 1. 处理文件上传
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        fileNameDisplay.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                // 图片加载后立即触发一次生成，方便预览
                triggerUpdate();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // 2. 生成按钮点击 (虽然现在是实时的，但保留按钮作为手动触发或明确操作)
    generateBtn.addEventListener('click', triggerUpdate);

    // 触发更新函数
    function triggerUpdate() {
        if (!originalImage) return;

        const lines = subtitleTextInput.value.split('\n');
        
        // 获取参数
        const sliceH = parseInt(sliceHeightInput.value, 10);
        const fontSize = parseInt(fontSizeInput.value, 10);
        const fontColor = fontColorInput.value;
        const strokeColor = strokeColorInput.value;
        const strokeWidth = parseInt(strokeWidthInput.value, 10);
        const marginBottom = parseInt(marginBottomInput.value, 10);

        if (isNaN(sliceH) || sliceH < 0) return; // 参数不合法时不更新

        generateSubtitleImage(originalImage, lines, {
            sliceHeight: sliceH,
            fontSize: fontSize,
            fontColor: fontColor,
            strokeColor: strokeColor,
            strokeWidth: strokeWidth,
            marginBottom: marginBottom
        });
    }

    // 3. 核心绘图函数
    function generateSubtitleImage(img, lines, options) {
        const ctx = resultCanvas.getContext('2d');
        const width = img.width;
        const height = img.height;
        
        // 计算总高度
        const extraLines = lines.length > 1 ? lines.length - 1 : 0;
        const totalHeight = height + (extraLines * options.sliceHeight);

        // 设置 Canvas 尺寸
        resultCanvas.width = width;
        resultCanvas.height = totalHeight;

        // 清空画布
        ctx.clearRect(0, 0, width, totalHeight);

        // 设置文字样式
        ctx.font = `bold ${options.fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; // 垂直居中
        ctx.fillStyle = options.fontColor;
        ctx.strokeStyle = options.strokeColor;
        ctx.lineWidth = options.strokeWidth;
        ctx.lineJoin = 'round'; // 圆角连接，防止描边尖刺

        // 步骤 A: 绘制原图 (包含第一行字幕)
        ctx.drawImage(img, 0, 0);

        // 绘制第一行文字 (如果有)
        if (lines.length > 0) {
            const line1 = lines[0];
            // 位置：水平居中，垂直位置在原图底部往上偏移一定距离
            const y = height - (options.sliceHeight / 2);
            drawTextWithStroke(ctx, line1, width / 2, y);
        }

        // 步骤 B: 循环拼接后续行
        for (let i = 1; i < lines.length; i++) {
            const lineText = lines[i];
            
            // 截取原图底部区域
            const sourceY = height - options.sliceHeight;
            const sourceH = options.sliceHeight;
            
            // 目标位置
            const destY = height + (i - 1) * options.sliceHeight;
            
            // 绘制切片
            ctx.drawImage(img, 0, sourceY, width, sourceH, 0, destY, width, sourceH);
            
            // 在切片中心绘制文字
            const textY = destY + (sourceH / 2);
            drawTextWithStroke(ctx, lineText, width / 2, textY);
        }

        // 完成后显示结果
        showPreview();
    }

    function drawTextWithStroke(ctx, text, x, y) {
        if (!text) return;
        if (ctx.lineWidth > 0) {
            ctx.strokeText(text, x, y);
        }
        ctx.fillText(text, x, y);
    }

    function showPreview() {
        placeholderText.style.display = 'none';
        
        // 导出为图片显示
        const dataURL = resultCanvas.toDataURL('image/png');
        resultImage.src = dataURL;
        resultImage.style.display = 'block';
        
        // 启用下载按钮
        downloadBtn.disabled = false;
        
        // 重新绑定下载事件（避免重复绑定，其实最好在外面绑定一次，这里更新 href 即可，但 dataURL 每次变）
        // 更好的做法是让 onclick 读取当前的 resultImage.src
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = `subtitle-image-${Date.now()}.png`;
            link.href = resultImage.src;
            link.click();
        };
    }

    function clearPreview() {
        resultImage.style.display = 'none';
        resultCanvas.style.display = 'none';
        placeholderText.style.display = 'block';
        downloadBtn.disabled = true;
    }
});
