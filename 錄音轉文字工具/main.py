import os
import sys
import time
import argparse
import warnings
from faster_whisper import WhisperModel
from opencc import OpenCC
from tqdm import tqdm
from colorama import init, Fore, Style

# Initialize colorama
init(autoreset=True)

# Suppress warnings
warnings.filterwarnings("ignore")

def trans_to_traditional(text):
    cc = OpenCC('s2twp') # Simplified to Traditional (Taiwan)
    return cc.convert(text)

def format_time(seconds):
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d}"

def process_file(model, file_path, output_dir):
    filename = os.path.basename(file_path)
    name, _ = os.path.splitext(filename)
    output_path = os.path.join(output_dir, f"{name}.txt")
    
    print(f"\n{Fore.CYAN}🎧 正在處理檔案: {filename}{Style.RESET_ALL}")
    
    start_time = time.time()
    
    try:
        # Transcribe
        # beam_size=5 is standard for accuracy
        segments, info = model.transcribe(file_path, beam_size=5, vad_filter=True)
        
        print(f"{Fore.GREEN}ℹ️  偵測語言: {info.language.upper()}  (機率: {info.language_probability:.0%}){Style.RESET_ALL}")
        print(f"{Fore.GREEN}ℹ️  音訊長度: {format_time(info.duration)}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}⏳ 轉錄中...{Style.RESET_ALL}")
        
        # Collect segments with progress bar
        # Since segments is a generator, we can't know exact total segments easily without creating them,
        # but faster-whisper yields them as they are processed.
        # We can use the duration to estimate progress if we wanted, but simple tqdm on generator is tricky.
        # We will manually print progress.
        
        results = []
        pbar = tqdm(total=round(info.duration, 2), unit='sec', bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}]")
        
        for segment in segments:
            # Convert text to Traditional Chinese
            text = segment.text
            # If language is Chinese, ensure Traditional. If English, keep as is (or translate?).
            # User requirement: "Convert received Chinese/English recordings to Traditional Chinese".
            # If Audio is English -> Text is English. User might want English->TradChinese?
            # Usually "Speech to Text" means transcription. 
            # If the user wants TRANSLATION (En audio -> Zh text), that's a different task.
            # Assuming Transcription first. 
            # If Audio is Chinese -> Output Simplified (usually) -> Convert to Traditional.
            # If Audio is English -> Output English.
            
            # Let's apply OpenCC to everything. It won't hurt English, but will fix Simplified Chinese.
            processed_text = trans_to_traditional(text)
            
            line = f"[{format_time(segment.start)} -> {format_time(segment.end)}] {processed_text}"
            results.append(line)
            
            pbar.update(segment.end - pbar.n)
            
        pbar.close()
        
        # Save to file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(f"檔名: {filename}\n")
            f.write(f"語言: {info.language}\n")
            f.write(f"長度: {format_time(info.duration)}\n")
            f.write("-" * 30 + "\n\n")
            f.write("\n".join(results))
            
        print(f"{Fore.GREEN}✅ 完成！已儲存至: {output_path}{Style.RESET_ALL}")
        
    except Exception as e:
        print(f"{Fore.RED}❌ 處理失敗: {e}{Style.RESET_ALL}")

def main():
    parser = argparse.ArgumentParser(description="離線錄音轉文字工具 (支援中/英 -> 繁體中文)")
    parser.add_argument("input", nargs='+', help="輸入的音訊檔案路徑 (支援 mp3, wav, m4a, mp4 等)")
    parser.add_argument("--model", default="medium", choices=["tiny", "base", "small", "medium", "large-v3"], help="模型大小 (預設: medium)")
    parser.add_argument("--output", "-o", default="output", help="輸出目錄 (預設: output)")
    parser.add_argument("--compute_type", default="int8", help="運算精度 (default: int8, Mac 可試 float16)")
    
    args = parser.parse_args()
    
    # Check output dir
    if not os.path.exists(args.output):
        os.makedirs(args.output)
        
    print(f"{Fore.MAGENTA}🚀 初始化模型: {args.model} ... (首次執行需下載模型){Style.RESET_ALL}")
    try:
        # device='cpu' or 'cuda'. On Mac M1/M2, faster-whisper runs on CPU with CTranslate2 optimization usually efficiently.
        # coreml is another option but complex setup.
        # Just use 'cpu' for broad compatibility or 'auto'.
        model = WhisperModel(args.model, device="auto", compute_type=args.compute_type)
    except Exception as e:
        print(f"{Fore.RED}模型載入失敗: {e}{Style.RESET_ALL}")
        return

    for file_path in args.input:
        if os.path.isfile(file_path):
            process_file(model, file_path, args.output)
        else:
            print(f"{Fore.RED}找不到檔案: {file_path}{Style.RESET_ALL}")

    print(f"\n{Fore.MAGENTA}🎉 全部工作完成！{Style.RESET_ALL}")

if __name__ == "__main__":
    main()
