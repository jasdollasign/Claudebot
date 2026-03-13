from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip
import re

def add_subtitles_to_video(input_video, output_video, transcriptions, video_start_time=0):
    """
    Add subtitles to video based on transcription segments.
    
    Args:
        input_video: Path to input video file
        output_video: Path to output video file
        transcriptions: List of [text, start, end] from transcribeAudio
        video_start_time: Start time offset if video was cropped
    """
    video = VideoFileClip(input_video)
    video_duration = video.duration
    
    # Filter transcriptions to only those within the video timeframe
    relevant_transcriptions = []
    for text, start, end in transcriptions:
        # Adjust times relative to video start
        adjusted_start = start - video_start_time
        adjusted_end = end - video_start_time
        
        # Only include if within video duration
        if adjusted_end > 0 and adjusted_start < video_duration:
            adjusted_start = max(0, adjusted_start)
            adjusted_end = min(video_duration, adjusted_end)
            relevant_transcriptions.append([text.strip(), adjusted_start, adjusted_end])
    
    if not relevant_transcriptions:
        print("No transcriptions found for this video segment")
        video.write_videofile(output_video, codec='libx264', audio_codec='aac')
        video.close()
        return
    
    # Create text clips for each transcription segment
    text_clips = []
    
    # Scale font size proportionally to video height (~8% of height for motivation impact)
    # 1080p → 86px, 720p → 58px — bigger = more punch
    dynamic_fontsize = int(video.h * 0.08)

    for text, start, end in relevant_transcriptions:
        # Clean up text — uppercase for motivation shorts impact
        text = text.strip().upper()
        if not text:
            continue

        # Create text clip with bold motivation styling
        txt_clip = TextClip(
            text,
            fontsize=dynamic_fontsize,
            color='white',
            stroke_color='black',
            stroke_width=4,
            font='Impact',
            method='caption',
            size=(video.w - 80, None)  # Leave 40px margin on each side
        )

        # Position center-bottom (above safe zone)
        txt_clip = txt_clip.set_position(('center', video.h - txt_clip.h - 150))
        txt_clip = txt_clip.set_start(start)
        txt_clip = txt_clip.set_duration(end - start)
        
        text_clips.append(txt_clip)
    
    # Composite video with subtitles
    print(f"Adding {len(text_clips)} subtitle segments to video...")
    final_video = CompositeVideoClip([video] + text_clips)
    
    # Write output
    final_video.write_videofile(
        output_video,
        codec='libx264',
        audio_codec='aac',
        fps=video.fps,
        preset='medium',
        bitrate='3000k'
    )
    
    video.close()
    final_video.close()
    print(f"✓ Subtitles added successfully -> {output_video}")
