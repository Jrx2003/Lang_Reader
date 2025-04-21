<template>
  <div class="video-editor">
    <!-- Video player container -->
    <div class="player-container">
      <!-- YouTube embedded player -->
      <div v-if="isYouTubeVideo" class="youtube-player-wrapper">
        <div ref="youtubePlayerRef" id="youtube-player"></div>
      </div>
      
      <!-- HTML5 video player -->
      <video
        v-else
        ref="videoRef"
        class="video-player"
        controls
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onVideoLoaded"
        @click.stop="onVideoClick"
        :src="videoUrl"
      ></video>
      
      <!-- Timeline -->
      <div class="timeline">
        <div class="timeline-current" :style="{ left: `${currentTimePercent}%` }"></div>
        <!-- Breakpoint markers -->
        <div 
          v-for="(breakpoint, index) in sortedBreakpoints" 
          :key="index"
          class="breakpoint-marker"
          :class="{ 'active': selectedBreakpoints.includes(index) }"
          :style="{ left: `${(breakpoint.time / duration) * 100}%` }"
          @click="toggleBreakpointSelection(index)"
          :title="`Time: ${formatTime(breakpoint.time)}${breakpoint.note ? ' - ' + breakpoint.note : ''}`"
        ></div>
        
        <!-- Loop region indicator -->
        <div 
          v-if="loopStart !== null && loopEnd !== null"
          class="loop-region"
          :style="{
            left: `${(getBreakpointTime(loopStart) / duration) * 100}%`,
            width: `${((getBreakpointTime(loopEnd) - getBreakpointTime(loopStart)) / duration) * 100}%`
          }"
        ></div>
      </div>
    </div>
    
    <!-- Basic playback controls -->
    <div class="playback-controls">
      <div class="playback-info">
        Current Time: {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </div>
      <div class="playback-buttons">
        <button 
          v-if="!readOnly"
          @click="addBreakpoint" 
          class="btn btn-primary"
          type="button"
          aria-label="Add breakpoint at current time"
        >
          Add Breakpoint ({{ formatTime(getCurrentRealTime()) }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, defineExpose } from 'vue'
import { useProjectsStore } from '../store/projects'

const props = defineProps({
  videoUrl: {
    type: String,
    required: true
  },
  projectId: {
    type: [String, Number],
    required: true
  },
  readOnly: {
    type: Boolean,
    default: false
  }
})

// Define emits
const emit = defineEmits(['update:loop-status', 'update:current-time', 'update:duration'])

// Get projects store
const projectsStore = useProjectsStore()

// Video related references
const videoRef = ref(null)
const youtubePlayerRef = ref(null)
let youtubePlayer = null

// Video state
const duration = ref(0)
const currentTime = ref(0)
const isYouTubeVideo = computed(() => {
  return props.videoUrl.includes('youtube.com') || props.videoUrl.includes('youtu.be')
})

// Extract YouTube video ID
const youtubeVideoId = computed(() => {
  if (!isYouTubeVideo.value) return null
  
  // Handle standard YouTube links
  if (props.videoUrl.includes('youtube.com/watch')) {
    const url = new URL(props.videoUrl)
    return url.searchParams.get('v')
  }
  
  // Handle short links
  if (props.videoUrl.includes('youtu.be')) {
    const parts = props.videoUrl.split('/')
    return parts[parts.length - 1].split('?')[0]
  }
  
  return null
})

// Breakpoint related
const sortedBreakpoints = computed(() => projectsStore.sortedBreakpoints)
const selectedBreakpoints = ref([])
const loopStart = ref(null)
const loopEnd = ref(null)

// Loop controls
const loopCount = ref(3)
const waitMs = ref(1000)
const isLooping = ref(false)
const currentLoopCount = ref(0)
let loopTimeout = null

// Current time percentage of total duration
const currentTimePercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// Format time as MM:SS.ss
const formatTime = (seconds) => {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00.00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

// Get time for specified breakpoint index
const getBreakpointTime = (index) => {
  if (index === null || !sortedBreakpoints.value[index]) return 0
  return sortedBreakpoints.value[index].time
}

// Time update handler for HTML5 video
const onTimeUpdate = () => {
  if (!videoRef.value) return
  
  // 更新当前时间
  const newTime = videoRef.value.currentTime
  currentTime.value = newTime
  
  // 发送时间更新事件
  emit('update:current-time', currentTime.value)
  
  // 检查循环条件 - 这里是关键逻辑
  if (isLooping.value && loopEnd.value !== null) {
    const endTime = getBreakpointTime(loopEnd.value)
    
    // 如果当前时间达到或超过结束点，触发循环结束处理
    if (newTime >= endTime) {
      console.log(`触发循环结束处理: 当前时间=${newTime.toFixed(2)}, 结束点=${endTime.toFixed(2)}`)
      // 立即暂停视频，防止继续播放
      videoRef.value.pause()
      // 处理循环结束
      handleLoopEnd()
    }
  }
}

// Video loaded handler
const onVideoLoaded = () => {
  if (!videoRef.value) return
  duration.value = videoRef.value.duration
  emit('update:duration', duration.value)
}

// Video click handler - can quickly add breakpoint
const onVideoClick = (event) => {
  // Prevent default pause/play behavior
  event.preventDefault()
  
  // Add breakpoint at current time
  addBreakpoint()
}

// Add breakpoint
const addBreakpoint = async () => {
  try {
    // Always get the most current time value directly
    const time = isYouTubeVideo.value && youtubePlayer ? 
      youtubePlayer.getCurrentTime() : 
      (videoRef.value ? videoRef.value.currentTime : currentTime.value)
    
    // Save video playing state
    const wasPlaying = isYouTubeVideo.value 
      ? (youtubePlayer && youtubePlayer.getPlayerState() === window.YT.PlayerState.PLAYING)
      : (videoRef.value && !videoRef.value.paused)
    
    console.log('Adding breakpoint at time:', time)
    
    // Add breakpoint without waiting for completion
    projectsStore.addBreakpoint({
      time,
      note: ''
    }).catch(error => {
      console.error('Failed to add breakpoint:', error)
    })
    
    // No need to pause or change video state
  } catch (error) {
    console.error('Failed to add breakpoint:', error)
  }
}

// Toggle breakpoint selection
const toggleBreakpointSelection = (index) => {
  const position = selectedBreakpoints.value.indexOf(index)
  if (position === -1) {
    // Add to selection list
    selectedBreakpoints.value.push(index)
    // If two breakpoints selected, automatically set loop start/end
    if (selectedBreakpoints.value.length === 2) {
      const [a, b] = selectedBreakpoints.value.sort((a, b) => a - b)
      loopStart.value = a
      loopEnd.value = b
      selectedBreakpoints.value = []
    }
  } else {
    // Remove from selection list
    selectedBreakpoints.value.splice(position, 1)
  }
}

// 在脚本开始处添加变量声明
let loopProcessing = false

// Start loop playback
const startLoop = async (start, end, count, wait) => {
  // 重置循环处理状态
  loopProcessing = false
  
  // 设置循环参数
  loopStart.value = start
  loopEnd.value = end
  loopCount.value = count || 3
  waitMs.value = wait || 1000
  
  // 验证参数
  if (loopStart.value === null || loopEnd.value === null) return
  
  // 初始化循环状态
  isLooping.value = true
  currentLoopCount.value = 0
  
  // 通知父组件循环状态变化
  emit('update:loop-status', { 
    isLooping: true, 
    currentCount: currentLoopCount.value, 
    totalCount: loopCount.value 
  })
  
  console.log(`开始循环：从断点${loopStart.value}(${getBreakpointTime(loopStart.value).toFixed(2)}秒) 到断点${loopEnd.value}(${getBreakpointTime(loopEnd.value).toFixed(2)}秒)，共${loopCount.value}次`)
  
  // 开始第一次循环播放
  startNextLoop()
}

// 监控YouTube播放进度
const checkYouTubeProgress = () => {
  if (!youtubePlayer || !isLooping.value) {
    if (youtubeIntervalId) {
      clearInterval(youtubeIntervalId)
      youtubeIntervalId = null
    }
    return
  }
  
  // 获取当前播放时间
  const time = youtubePlayer.getCurrentTime()
  currentTime.value = time
  emit('update:current-time', time)
  
  // 检查是否到达循环结束点
  if (loopEnd.value !== null) {
    const endTime = getBreakpointTime(loopEnd.value)
    
    // 如果当前时间达到或超过结束点，触发循环结束处理
    if (time >= endTime) {
      console.log(`触发YouTube循环结束处理: 当前时间=${time.toFixed(2)}, 结束点=${endTime.toFixed(2)}`)
      // 立即暂停视频，防止继续播放
      youtubePlayer.pauseVideo()
      // 处理循环结束
      handleLoopEnd()
    }
  }
}

// 处理循环结束并开始下一个循环
const handleLoopEnd = () => {
  // 防止重复触发
  if (loopProcessing) return
  loopProcessing = true
  
  // 确保视频暂停
  pauseMedia()
  
  // 增加完成的循环次数
  currentLoopCount.value++
  console.log(`循环 ${currentLoopCount.value}/${loopCount.value} 完成`)
  
  // 通知父组件循环状态更新
  emit('update:loop-status', { 
    isLooping: true, 
    currentCount: currentLoopCount.value, 
    totalCount: loopCount.value 
  })
  
  // 检查是否已完成所有循环
  if (currentLoopCount.value >= loopCount.value) {
    console.log('所有循环已完成')
    stopLoop()
    loopProcessing = false
    return
  }
  
  // 等待指定时间后开始下一个循环
  console.log(`等待 ${waitMs.value} 毫秒后开始下一个循环`)
  clearTimeout(loopTimeout)
  loopTimeout = setTimeout(() => {
    // 再次检查是否仍处于循环状态
    if (!isLooping.value) {
      console.log('循环已被停止，取消后续循环')
      loopProcessing = false
      return
    }
    
    console.log('开始下一个循环')
    startNextLoop()
  }, waitMs.value)
}

// 开始下一个循环的辅助函数
const startNextLoop = () => {
  if (!isLooping.value) return
  
  if (isYouTubeVideo.value && youtubePlayer) {
    console.log(`将YouTube视频重置到起始点: ${getBreakpointTime(loopStart.value).toFixed(2)}秒`)
    youtubePlayer.seekTo(getBreakpointTime(loopStart.value), true)
    youtubePlayer.playVideo()
    
    // 确保YouTube监控在运行
    if (!youtubeIntervalId) {
      youtubeIntervalId = setInterval(checkYouTubeProgress, 100)
    }
  } else if (videoRef.value) {
    console.log(`将HTML5视频重置到起始点: ${getBreakpointTime(loopStart.value).toFixed(2)}秒`)
    videoRef.value.currentTime = getBreakpointTime(loopStart.value)
    videoRef.value.play().catch(err => console.error('播放失败:', err))
  }
  
  loopProcessing = false
}

// 暂停媒体播放的辅助函数
const pauseMedia = () => {
  try {
    if (isYouTubeVideo.value && youtubePlayer) {
      youtubePlayer.pauseVideo()
    } else if (videoRef.value) {
      videoRef.value.pause()
    }
  } catch (error) {
    console.error('暂停媒体时出错:', error)
  }
}

// Stop loop
const stopLoop = () => {
  console.log('停止循环')
  isLooping.value = false
  currentLoopCount.value = 0
  loopProcessing = false
  clearTimeout(loopTimeout)
  
  emit('update:loop-status', { isLooping: false })
  
  if (youtubeIntervalId) {
    clearInterval(youtubeIntervalId)
    youtubeIntervalId = null
  }
}

// YouTube player related
let youtubeIntervalId = null

// Initialize YouTube player
const initYouTubePlayer = () => {
  if (!isYouTubeVideo.value || !youtubeVideoId.value) return
  
  // Ensure YouTube API is loaded
  if (!window.YT || !window.YT.Player) {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    
    window.onYouTubeIframeAPIReady = () => {
      createYouTubePlayer()
    }
  } else {
    createYouTubePlayer()
  }
}

// Create YouTube player instance
const createYouTubePlayer = () => {
  if (!youtubePlayerRef.value) return
  
  // Destroy old player instance
  if (youtubePlayer) {
    youtubePlayer.destroy()
  }
  
  // Create new player instance
  youtubePlayer = new window.YT.Player('youtube-player', {
    height: '100%',
    width: '100%',
    videoId: youtubeVideoId.value,
    playerVars: {
      'playsinline': 1,
      'controls': 1,
      'enablejsapi': 1
    },
    events: {
      'onReady': onYouTubePlayerReady,
      'onStateChange': onYouTubePlayerStateChange
    }
  })
}

// YouTube player ready event
const onYouTubePlayerReady = (event) => {
  duration.value = youtubePlayer.getDuration()
  emit('update:duration', duration.value)
  
  // Setup time updates for YouTube
  setupYouTubeTimeUpdates()
}

// YouTube player state change event
const onYouTubePlayerStateChange = (event) => {
  // 视频结束事件
  if (event.data === window.YT.PlayerState.ENDED) {
    if (isLooping.value) {
      console.log('YouTube视频播放结束，处理循环')
      handleLoopEnd()
    }
  }
  
  // 当视频正在播放并且处于循环模式时，确保监控间隔在运行
  if (event.data === window.YT.PlayerState.PLAYING && isLooping.value) {
    if (!youtubeIntervalId) {
      console.log('启动YouTube监控间隔')
      youtubeIntervalId = setInterval(checkYouTubeProgress, 100)
    }
  }
  
  // 更新当前时间
  if (youtubePlayer) {
    currentTime.value = youtubePlayer.getCurrentTime()
    emit('update:current-time', currentTime.value)
  }
}

// Start a separate interval to continuously update YouTube time
let youtubeTimeUpdateInterval = null

// Setup continuous time updates for YouTube
const setupYouTubeTimeUpdates = () => {
  // Clear any existing interval
  if (youtubeTimeUpdateInterval) {
    clearInterval(youtubeTimeUpdateInterval)
  }
  
  // Set new interval to update time every 100ms
  youtubeTimeUpdateInterval = setInterval(() => {
    if (youtubePlayer && youtubePlayer.getPlayerState && youtubePlayer.getPlayerState() === window.YT.PlayerState.PLAYING) {
      currentTime.value = youtubePlayer.getCurrentTime()
      emit('update:current-time', currentTime.value)
    }
  }, 100)
}

// Watch for videoUrl changes
watch(() => props.videoUrl, (newUrl) => {
  if (isYouTubeVideo.value) {
    initYouTubePlayer()
  }
}, { immediate: true })

// Component mounted
onMounted(() => {
  // If YouTube video, initialize YouTube player
  if (isYouTubeVideo.value) {
    initYouTubePlayer()
  } else {
    // For standard HTML5 video, set up more frequent time updates
    setupVideoTimeUpdates()
  }
})

// Component unmounted
onUnmounted(() => {
  // Clean up timers
  clearTimeout(loopTimeout)
  
  if (youtubeIntervalId) {
    clearInterval(youtubeIntervalId)
  }
  
  // Clear YouTube time update interval
  if (youtubeTimeUpdateInterval) {
    clearInterval(youtubeTimeUpdateInterval)
  }
  
  // Destroy YouTube player
  if (youtubePlayer) {
    youtubePlayer.destroy()
    youtubePlayer = null
  }
})

// Expose seekTo method for external components to call
const seekTo = (time) => {
  if (typeof time !== 'number' || isNaN(time)) {
    console.error('Invalid time value for seeking:', time)
    return
  }
  
  console.log('Seeking to time:', time)
  
  if (isYouTubeVideo.value && youtubePlayer) {
    youtubePlayer.seekTo(time, true)
  } else if (videoRef.value) {
    videoRef.value.currentTime = time
  }
}

// Get current real-time from video element or YouTube player
const getCurrentRealTime = () => {
  if (isYouTubeVideo.value && youtubePlayer) {
    return youtubePlayer.getCurrentTime()
  } else if (videoRef.value) {
    return videoRef.value.currentTime
  }
  return currentTime.value
}

// Expose methods for parent component
defineExpose({
  seekTo,
  startLoop,
  stopLoop
})

// Setup more frequent time updates for HTML5 video
const setupVideoTimeUpdates = () => {
  // 更高频率地更新时间，比原生timeupdate事件更频繁
  const videoTimeInterval = setInterval(() => {
    if (videoRef.value && !videoRef.value.paused) {
      currentTime.value = videoRef.value.currentTime;
      emit('update:current-time', currentTime.value);
      
      // 在这里也检查循环条件，确保不会错过循环结束点
      if (isLooping.value && loopEnd.value !== null) {
        const endTime = getBreakpointTime(loopEnd.value);
        if (currentTime.value >= endTime - 0.1 || currentTime.value >= endTime) {
          console.log(`定时器检测到HTML5视频到达循环结束点: 当前${currentTime.value}秒, 结束点${endTime}秒`);
          handleLoopEnd();
        }
      }
    }
  }, 50); // 更高频率检查，每50ms一次
  
  // 组件卸载时清理
  onUnmounted(() => {
    clearInterval(videoTimeInterval);
  });
}
</script>

<style scoped>
.video-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.player-container {
  width: 100%;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: var(--card-bg);
  flex: 1;
}

.youtube-player-wrapper, .video-player {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000;
}

.timeline {
  position: relative;
  height: 20px;
  margin-top: 2px;
  background-color: var(--bg-color);
  cursor: pointer;
}

.timeline-current {
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background-color: var(--primary-color);
  z-index: 2;
}

.breakpoint-marker {
  position: absolute;
  top: 0;
  width: 4px;
  height: 100%;
  background-color: var(--primary-color);
  transform: translateX(-50%);
  cursor: pointer;
  z-index: 1;
}

.breakpoint-marker.active {
  background-color: var(--success-color);
  width: 6px;
}

.loop-region {
  position: absolute;
  top: 0;
  height: 100%;
  background-color: rgba(46, 204, 113, 0.3);
  z-index: 0;
}

.playback-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--card-bg);
  padding: 0.75rem;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.playback-info {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--text-color);
}

.btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .playback-controls {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .playback-buttons {
    width: 100%;
  }
}
</style> 