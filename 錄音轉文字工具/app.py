import streamlit as st
import os
import time
import tempfile
from faster_whisper import WhisperModel
from opencc import OpenCC

# Page Config
st.set_page_config(page_title="語音轉文字工具 (離線版)", page_icon="🎙️")

st.title("🎙️ 離線語音轉繁體中文工具")
st.markdown("上傳錄音檔 (mp3, wav, m4a)，即可將其轉錄為文字。所有運算皆在您的電腦上執行，不會上傳至雲端。")

# Model Loader (Cached)
@st.cache_resource
def load_model(model_size, compute_type):
    return WhisperModel(model_size, device="auto", compute_type=compute_type)

# Helper: Time Format
def format_time(seconds):
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d}"

# Helper: Trad Chinese
def to_traditional(text):
    cc = OpenCC('s2twp')
    return cc.convert(text)

# Sidebar Settings
st.sidebar.header("⚙️ 設定")
model_size = st.sidebar.selectbox("模型大小 (Model Size)", ["tiny", "base", "small", "medium", "large-v3"], index=1, help="越大的模型越準確，但速度越慢。建議使用 base 或 small。")
compute_type = st.sidebar.selectbox("運算模式", ["int8", "float32"], index=0, help="Mac M系列晶片通常 Int8 夠快且省記憶體。")

# File Upload
uploaded_file = st.file_uploader("選擇錄音檔", type=["mp3", "wav", "m4a", "mp4", "mpeg"])

if uploaded_file is not None:
    st.audio(uploaded_file, format='audio/mp3')
    
    if st.button("🚀 開始轉錄", type="primary"):
        # Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(uploaded_file.name)[1]) as tmp_file:
            tmp_file.write(uploaded_file.getvalue())
            tmp_path = tmp_file.name
            
        try:
            with st.spinner(f"正在載入模型 ({model_size})... 請稍候 (首次需下載模型)"):
                model = load_model(model_size, compute_type)
            
            st.success("模型載入完成！開始分析音訊...")
            
            # Start Transcription
            start_time = time.time()
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            # Use optimized parameters to prevent hallucinations (repeating text)
            segments, info = model.transcribe(
                tmp_path, 
                beam_size=5, 
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=500),
                condition_on_previous_text=False, # Critical for preventing loops
                initial_prompt="以下是普通話的逐字稿，請忽略背景雜音。"
            )
            
            total_duration = info.duration
            st.info(f"偵測語言: {info.language.upper()} | 音訊長度: {format_time(total_duration)}")
            
            results = []
            current_time = 0
            
            result_container = st.container()
            
            for segment in segments:
                # Update Progress
                current_time = segment.end
                progress = min(current_time / total_duration, 1.0)
                progress_bar.progress(progress)
                status_text.text(f"正在轉錄: {format_time(current_time)} / {format_time(total_duration)}")
                
                # Text Processing
                text = to_traditional(segment.text)
                line = f"[{format_time(segment.start)} -> {format_time(segment.end)}] {text}"
                results.append(line)
                
                # Stream output
                with result_container:
                    st.markdown(f"**{format_time(segment.start)}**: {text}")
            
            progress_bar.progress(1.0)
            status_text.text("✅ 轉錄完成！")
            
            # Download Button
            full_text = "\n".join(results)
            output_name = os.path.splitext(uploaded_file.name)[0] + "_transcription.txt"
            
            st.download_button(
                label="📥 下載轉錄文字檔 (TXT)",
                data=full_text,
                file_name=output_name,
                mime="text/plain"
            )
            
        except Exception as e:
            st.error(f"發生錯誤: {e}")
        finally:
            # Cleanup
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
