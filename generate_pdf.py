import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT

def markdown_to_html(text):
    # Convert bold **text** to <b>text</b>
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    # Convert italic *text* to <i>text</i>
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    # Escape & for reportlab (since it acts like XML)
    text = text.replace('&', '&amp;')
    return text

def generate_pdf(input_md_path, output_pdf_path):
    # Read the markdown file
    with open(input_md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    doc = SimpleDocTemplate(output_pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#2E3B4E")
    )
    
    heading_style = ParagraphStyle(
        'HeadingStyle',
        parent=styles['Heading2'],
        fontSize=18,
        spaceBefore=15,
        spaceAfter=10,
        textColor=colors.HexColor("#4A90E2")
    )
    
    subheading_style = ParagraphStyle(
        'SubHeadingStyle',
        parent=styles['Heading3'],
        fontSize=14,
        spaceBefore=10,
        spaceAfter=5,
        textColor=colors.HexColor("#333333")
    )
    
    normal_style = styles['Normal']
    normal_style.fontSize = 11
    normal_style.leading = 14
    normal_style.spaceAfter = 8

    elements = []

    for line in lines:
        line = line.strip()
        if not line:
            elements.append(Spacer(1, 10))
            continue
        
        # Heading 1
        if line.startswith('# '):
            elements.append(Paragraph(markdown_to_html(line[2:]), title_style))
        # Heading 2
        elif line.startswith('## '):
            elements.append(Paragraph(markdown_to_html(line[3:]), heading_style))
        # Heading 3
        elif line.startswith('### '):
            elements.append(Paragraph(markdown_to_html(line[4:]), subheading_style))
        # Tables (Very basic detection)
        elif line.startswith('|'):
            # Convert simple table bars to clean text
            clean_line = line.replace('|', ' | ')
            elements.append(Paragraph(markdown_to_html(f"<i>{clean_line}</i>"), normal_style))
        # List items
        elif line.startswith('* ') or line.startswith('- '):
            elements.append(Paragraph(f"• {markdown_to_html(line[2:])}", normal_style))
        # Numbered lists (basic)
        elif re.match(r'^\d+\.', line):
             elements.append(Paragraph(markdown_to_html(line), normal_style))
        # Horizontal rule
        elif line.startswith('---'):
            elements.append(Spacer(1, 10))
        else:
            elements.append(Paragraph(markdown_to_html(line), normal_style))

    doc.build(elements)
    print(f"PDF generated successfully at {output_pdf_path}")

if __name__ == "__main__":
    input_path = "/home/dev24/work/Content-Virality-Predictor/PRD.md"
    output_path = "/home/dev24/work/Content-Virality-Predictor/PRD.pdf"
    generate_pdf(input_path, output_path)
