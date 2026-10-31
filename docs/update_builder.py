import os

path = r"C:\Users\Raksha\elder-care\elder-care\docs\build_comprehensive_report.py"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Update leading and styles
text = text.replace("fontSize=10.5, leading=16.0,", "fontSize=11.0, leading=17.5,")
text = text.replace("fontSize=10.0, leading=15.0,", "fontSize=10.5, leading=16.5,")

# Add additional algorithms to Chapter 5
search_str = "for algo_title, algo_code in exp.ALGORITHMS_DETAILED:"
replace_str = """all_algos = exp.ALGORITHMS_DETAILED + exp.ADDITIONAL_ALGORITHMS
    for algo_title, algo_code in all_algos:"""
if search_str in text:
    text = text.replace(search_str, replace_str)

# Replace t63_data with exp.EXPANDED_TEST_CASES
search_t63 = "t63_data = ["
idx_start = text.find(search_t63)
idx_end = text.find("t_63 = Table(", idx_start)
if idx_start != -1 and idx_end != -1:
    replacement = "t63_data = [['Test ID', 'Scenario Description', 'Input / State', 'Expected Output', 'Result']] + exp.EXPANDED_TEST_CASES\n    "
    text = text[:idx_start] + replacement + text[idx_end:]

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("build_comprehensive_report.py updated cleanly!")
