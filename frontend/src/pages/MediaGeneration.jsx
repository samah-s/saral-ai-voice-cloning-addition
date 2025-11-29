// /* MediaGeneration.jsx – fully-automatic video build */

// import React, { useState } from 'react';
// import { motion } from 'framer-motion';
// import {
//   FiMic, FiVideo, FiVolume2, FiArrowRight
// } from 'react-icons/fi';
// import Layout           from '../components/common/Layout';
// import LoadingSpinner   from '../components/common/LoadingSpinner';
// import { useWorkflow }  from '../contexts/WorkflowContext';
// import { apiService }   from '../services/api';
// import toast            from 'react-hot-toast';
// import { useNavigate }  from 'react-router-dom';
// import { TTS_VOICES }   from '../utils/constants';

// /* ───────────────── voice selector ───────────────── */
// const VoiceSelector = ({ language, value, onChange }) => (
//   <div className="space-y-2">
//     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//       Voice
//     </label>
//     <select
//       value={value}
//       onChange={e => onChange(language, e.target.value)}
//       className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900
//                  border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100
//                  focus:outline-none focus:ring-2 focus:ring-gray-700">
//       {Object.entries(TTS_VOICES[language.toUpperCase()] || {})
//         .map(([k, label]) => <option key={k} value={k}>{label}</option>)}
//     </select>
//   </div>
// );

// /* ─────────────────────────── main page ─────────────────────────── */
// const SUPPORTED_LANGUAGES = [
//   'English','Hindi','Bengali','Gujarati','Kannada','Malayalam',
//   'Marathi','Odia','Punjabi','Tamil','Telugu'
// ];

// // Initialize voiceSelections for all languages with a default (first available) voice
// const getDefaultVoices = () => {
//   const defaults = {};
//   SUPPORTED_LANGUAGES.forEach(lang => {
//     const voices = Object.keys(TTS_VOICES[lang.toUpperCase()] || {});
//     if (voices.length > 0) defaults[lang] = voices[0];
//   });
//   return defaults;
// };

// const MediaGeneration = () => {
//   const navigate = useNavigate();
//   const { 
//     paperId, 
//     audioFiles,
//     videoPath,
//     completedSteps, 
//     setAudioFiles, 
//     setVideoPath, 
//     markStepCompleted,
//     progressToNextStep 
//   } = useWorkflow();

//   /* local state */
//   const [voiceSelections, setVoiceSelections] = useState(getDefaultVoices());
//   const [selectedLanguage, setSelectedLang]   = useState('English');
//   const [hinglishIterations, setHinglishIterations] = useState(3);

//   const [audioLoading, setAudioLoading] = useState(false);   // spinner 1
//   const [videoLoading, setVideoLoading] = useState(false);   // spinner 2

//   // Check if media has been generated
//   const hasAudioFiles = audioFiles && audioFiles.length > 0;
//   const hasVideoPath = videoPath && videoPath.trim() !== '';
//   const mediaGenerated = hasAudioFiles && hasVideoPath;

//   /* helper: update voice */
//   const changeVoice = (lang, voice) =>
//     setVoiceSelections(v => ({
//       ...v,
//       [lang]: voice
//     }));

//   /* ───── 1. generate audio then auto-trigger video ───── */
//   const generateAudio = async () => {
//     if (!paperId) return;
//     setAudioLoading(true);
//     try {
//       const cfg = {
//         voice_selection   : voiceSelections,
//         hinglish_iterations: hinglishIterations,
//         show_hindi_debug  : false,
//         selected_language : selectedLanguage
//       };
//       const { data } = await apiService.generateAudio(paperId, cfg);
//       setAudioFiles(data.audio_files || []);
//       toast.success('Audio ready – generating video…');

//       /* immediately kick off video build */
//       await generateVideo();
//     } catch (error) {
//       console.error('Audio generation failed:', error);
//       toast.error('Audio generation failed');
//     } finally {
//       setAudioLoading(false);
//     }
//   };

//   /* ───── 2. generate video then auto-redirect ───── */
//   const generateVideo = async () => {
//     if (!paperId) return;
//     setVideoLoading(true);
//     try {
//       const cfg = { selected_language: selectedLanguage };
//       const { data } = await apiService.generateVideo(paperId, cfg);
//       setVideoPath(data.video_path);
      
//       // Mark step 5 (Media Generation) as completed
//       markStepCompleted(5);
      
//       toast.success('Video created successfully!');

//       // Auto-progress to results page for first-time generation
//       const isFirstTimeGeneration = !completedSteps.includes(5);
//       if (isFirstTimeGeneration) {
//         progressToNextStep(); // This will automatically navigate to /results        
//       }

//     } catch (error) {
//       console.error('Video generation failed:', error);
//       toast.error('Video generation failed');
//     } finally {
//       setVideoLoading(false);
//     }
//   };


//   /* ───── 3. redirect to results page ───── */
//   const goToResults = () => {
//     progressToNextStep();
//     navigate('/results', { replace: true });
//   };

//   /* ─────────────────────────── ui ─────────────────────────── */
//   const crumbs = [{ label:'Media Generation', href:'/media-generation' }];
//   if (!paperId) {
//     return (
//       <Layout title="" breadcrumbs={crumbs}>
//         <div className="text-center py-12 text-gray-600 dark:text-gray-400">
//           Upload a paper and create slides first.
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout breadcrumbs={crumbs}>
//       <div className="max-w-3xl mx-auto space-y-8">

//         {/* header */}
//         <div>
//           <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
//             Generate Audio & Video
//           </h2>
//           <p className="text-gray-600 dark:text-gray-400">
//             {mediaGenerated 
//               ? 'Your audio and video have been generated successfully!' 
//               : 'Click once – the system narrates your slides and builds the video automatically.'
//             }
//           </p>
//         </div>

//         {/* generator card */}
//         <motion.div
//           initial={{ opacity:0, y:20 }}
//           animate={{ opacity:1, y:0 }}
//           className="bg-white dark:bg-neutral-800 rounded-xl p-6
//                      border border-neutral-200 dark:border-neutral-700 space-y-6">

//           {/* spinner bar */}
//           {(audioLoading || videoLoading) && (
//             <div className="h-1 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden mb-4">
//               <div className="h-full w-full animate-pulse bg-gray-700 dark:bg-gray-400" />
//             </div>
//           )}

//           {/* Success indicator */}
//           {mediaGenerated && !audioLoading && !videoLoading && (
//             <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
//               <div className="flex items-center gap-3">
//                 <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
//                   <FiVideo className="w-4 h-4 text-gray-600 dark:text-gray-400" />
//                 </div>
//                 <div>
//                   <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
//                     Media Generation Complete
//                   </h4>
//                   <p className="text-sm text-gray-700 dark:text-gray-300">
//                     Audio narration and video presentation have been successfully created.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* settings grid - disabled when media is generated */}
//           <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${mediaGenerated ? 'opacity-50' : ''}`}>
//             {/* Only show VoiceSelector for selected language */}
//             <VoiceSelector
//               language={selectedLanguage}
//               value={voiceSelections[selectedLanguage]}
//               onChange={changeVoice}
//             />

//             {/* language picker */}
//             <div className="space-y-2">
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 Language
//               </label>
//               <select
//                 value={selectedLanguage}
//                 onChange={e => setSelectedLang(e.target.value)}
//                 disabled={mediaGenerated}
//                 className="w-full px-3 py-2 border rounded-md
//                            bg-white dark:bg-gray-900
//                            border-gray-300 dark:border-gray-600
//                            text-gray-900 dark:text-gray-100
//                            focus:outline-none focus:ring-2 focus:ring-gray-700
//                            disabled:opacity-50 disabled:cursor-not-allowed">
//                 {SUPPORTED_LANGUAGES.map(l => <option key={l}>{l}</option>)}
//               </select>
//             </div>
//           </div>

//           {/* Action buttons */}
//           {!mediaGenerated ? (
//             /* Generate button - shown when media not generated */
//             <button
//               onClick={generateAudio}
//               disabled={audioLoading || videoLoading}
//               className="w-full flex items-center justify-center gap-2 px-6 py-3
//                          rounded-md bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400
//                          text-white font-medium transition-colors duration-150">
//               {(audioLoading || videoLoading) ? (
//                 <>
//                   <LoadingSpinner size="sm" />
//                   {audioLoading ? 'Generating audio…' : 'Building video…'}
//                 </>
//               ) : (
//                 <>
//                   <FiMic className="w-5 h-5" />
//                   Generate Audio & Video
//                 </>
//               )}
//             </button>
//           ) : (
//             /* Results button - shown when media is generated */
//             <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
//               <button
//                 onClick={goToResults}
//                 className="flex-1 flex items-center justify-center gap-2 
//                            px-4 sm:px-6 py-3 sm:py-3
//                            rounded-md bg-gray-900 hover:bg-gray-700 
//                            text-white font-medium transition-colors duration-150
//                            text-sm sm:text-base min-h-[44px] w-full sm:w-auto
//                            touch-manipulation">
//                 <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
//                 <span className="whitespace-nowrap">View Results</span>
//               </button>
//             </div>

//           )}

//           {/* Media status indicators */}
//           {(hasAudioFiles || hasVideoPath) && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
//               <div className={`flex items-center gap-2 text-sm ${hasAudioFiles ? 'text-gray-600 dark:text-gray-400' : 'text-neutral-400'}`}>
//                 <FiMic className="w-4 h-4" />
//                 <span>Audio: {hasAudioFiles ? 'Generated' : 'Pending'}</span>
//               </div>
//               <div className={`flex items-center gap-2 text-sm ${hasVideoPath ? 'text-gray-600 dark:text-gray-400' : 'text-neutral-400'}`}>
//                 <FiVideo className="w-4 h-4" />
//                 <span>Video: {hasVideoPath ? 'Generated' : 'Pending'}</span>
//               </div>
//             </div>
//           )}
//         </motion.div>
//       </div>
//     </Layout>
//   );
// };

// export default MediaGeneration;

/* MediaGeneration.jsx – with Coqui TTS voice cloning support (FREE!) */

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FiMic, FiVideo, FiVolume2, FiArrowRight, FiUpload, FiX
} from 'react-icons/fi';
import Layout           from '../components/common/Layout';
import LoadingSpinner   from '../components/common/LoadingSpinner';
import { useWorkflow }  from '../contexts/WorkflowContext';
import { apiService }   from '../services/api';
import toast            from 'react-hot-toast';
import { useNavigate }  from 'react-router-dom';
import { TTS_VOICES }   from '../utils/constants';

/* ───────────────── voice selector ───────────────── */
const VoiceSelector = ({ language, value, onChange }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      Voice
    </label>
    <select
      value={value}
      onChange={e => onChange(language, e.target.value)}
      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900
                 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100
                 focus:outline-none focus:ring-2 focus:ring-gray-700">
      {Object.entries(TTS_VOICES[language.toUpperCase()] || {})
        .map(([k, label]) => <option key={k} value={k}>{label}</option>)}
    </select>
  </div>
);

/* ───────────────── voice sample upload ───────────────── */
const VoiceSampleUpload = ({ onFileSelect, selectedFile, onRemove, disabled }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        toast.error('Please select an audio file');
        return;
      }
      // Validate file size (max 25MB for Coqui)
      if (file.size > 25 * 1024 * 1024) {
        toast.error('Audio file must be less than 25MB');
        return;
      }
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Voice Sample (for cloning) 
        <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-semibold">
          FREE - No API key needed!
        </span>
      </label>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />
        {!selectedFile ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600
                       rounded-md bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300
                       hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-150">
            <FiUpload className="w-4 h-4" />
            <span>Upload Voice Sample</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600
                          rounded-md bg-gray-50 dark:bg-gray-800">
            <FiVolume2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
              {selectedFile.name}
            </span>
            <button
              onClick={onRemove}
              disabled={disabled}
              className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded
                         disabled:opacity-50 disabled:cursor-not-allowed">
              <FiX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Upload a 10-30 second clear audio sample (MP3, WAV, etc.) • Processed locally with Coqui TTS
      </p>
    </div>
  );
};

/* ─────────────────────────── main page ─────────────────────────── */
const SUPPORTED_LANGUAGES = [
  'English','Hindi','Bengali','Gujarati','Kannada','Malayalam',
  'Marathi','Odia','Punjabi','Tamil','Telugu'
];

// Initialize voiceSelections for all languages with a default (first available) voice
const getDefaultVoices = () => {
  const defaults = {};
  SUPPORTED_LANGUAGES.forEach(lang => {
    const voices = Object.keys(TTS_VOICES[lang.toUpperCase()] || {});
    if (voices.length > 0) defaults[lang] = voices[0];
  });
  return defaults;
};

const MediaGeneration = () => {
  const navigate = useNavigate();
  const { 
    paperId, 
    audioFiles,
    videoPath,
    completedSteps, 
    setAudioFiles, 
    setVideoPath, 
    markStepCompleted,
    progressToNextStep 
  } = useWorkflow();

  /* local state */
  const [voiceSelections, setVoiceSelections] = useState(getDefaultVoices());
  const [selectedLanguage, setSelectedLang]   = useState('English');
  const [hinglishIterations, setHinglishIterations] = useState(3);
  const [useVoiceCloning, setUseVoiceCloning] = useState(false);
  const [voiceSampleFile, setVoiceSampleFile] = useState(null);
  const [voiceSampleUploaded, setVoiceSampleUploaded] = useState(false);

  const [audioLoading, setAudioLoading] = useState(false);   // spinner 1
  const [videoLoading, setVideoLoading] = useState(false);   // spinner 2
  const [uploadingVoice, setUploadingVoice] = useState(false);

  // Check if media has been generated
  const hasAudioFiles = audioFiles && audioFiles.length > 0;
  const hasVideoPath = videoPath && videoPath.trim() !== '';
  const mediaGenerated = hasAudioFiles && hasVideoPath;

  /* helper: update voice */
  const changeVoice = (lang, voice) =>
    setVoiceSelections(v => ({
      ...v,
      [lang]: voice
    }));

  /* handle voice sample file selection */
  const handleVoiceSampleSelect = async (file) => {
    setVoiceSampleFile(file);
    setUploadingVoice(true);
    
    try {
      await apiService.uploadVoiceSample(paperId, file);
      setVoiceSampleUploaded(true);
      toast.success('Voice sample uploaded successfully');
    } catch (error) {
      console.error('Voice sample upload failed:', error);
      toast.error('Failed to upload voice sample');
      setVoiceSampleFile(null);
    } finally {
      setUploadingVoice(false);
    }
  };

  /* remove voice sample */
  const handleRemoveVoiceSample = () => {
    setVoiceSampleFile(null);
    setVoiceSampleUploaded(false);
  };

  /* ───── 1. generate audio then auto-trigger video ───── */
  const generateAudio = async () => {
    if (!paperId) return;
    
    // Validate voice cloning requirements
    if (useVoiceCloning && !voiceSampleUploaded) {
      toast.error('Please upload a voice sample for voice cloning');
      return;
    }
    
    setAudioLoading(true);
    try {
      const cfg = {
        voice_selection   : voiceSelections,
        hinglish_iterations: hinglishIterations,
        show_hindi_debug  : false,
        selected_language : selectedLanguage,
        use_voice_cloning : useVoiceCloning
      };
      const { data } = await apiService.generateAudio(paperId, cfg);
      setAudioFiles(data.audio_files || []);
      toast.success('Audio ready – generating video…');

      /* immediately kick off video build */
      await generateVideo();
    } catch (error) {
      console.error('Audio generation failed:', error);
      toast.error('Audio generation failed');
    } finally {
      setAudioLoading(false);
    }
  };

  /* ───── 2. generate video then auto-redirect ───── */
  const generateVideo = async () => {
    if (!paperId) return;
    setVideoLoading(true);
    try {
      const cfg = { selected_language: selectedLanguage };
      const { data } = await apiService.generateVideo(paperId, cfg);
      setVideoPath(data.video_path);
      
      // Mark step 5 (Media Generation) as completed
      markStepCompleted(5);
      
      toast.success('Video created successfully!');

      // Auto-progress to results page for first-time generation
      const isFirstTimeGeneration = !completedSteps.includes(5);
      if (isFirstTimeGeneration) {
        progressToNextStep(); // This will automatically navigate to /results        
      }

    } catch (error) {
      console.error('Video generation failed:', error);
      toast.error('Video generation failed');
    } finally {
      setVideoLoading(false);
    }
  };

  /* ───── 3. redirect to results page ───── */
  const goToResults = () => {
    progressToNextStep();
    navigate('/results', { replace: true });
  };

  /* ─────────────────────────── ui ─────────────────────────── */
  const crumbs = [{ label:'Media Generation', href:'/media-generation' }];
  if (!paperId) {
    return (
      <Layout title="" breadcrumbs={crumbs}>
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          Upload a paper and create slides first.
        </div>
      </Layout>
    );
  }

  return (
    <Layout breadcrumbs={crumbs}>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* header */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Generate Audio & Video
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {mediaGenerated 
              ? 'Your audio and video have been generated successfully!' 
              : 'Click once – the system narrates your slides and builds the video automatically.'
            }
          </p>
        </div>

        {/* generator card */}
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          className="bg-white dark:bg-neutral-800 rounded-xl p-6
                     border border-neutral-200 dark:border-neutral-700 space-y-6">

          {/* spinner bar */}
          {(audioLoading || videoLoading || uploadingVoice) && (
            <div className="h-1 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden mb-4">
              <div className="h-full w-full animate-pulse bg-gray-700 dark:bg-gray-400" />
            </div>
          )}

          {/* Success indicator */}
          {mediaGenerated && !audioLoading && !videoLoading && (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <FiVideo className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                    Media Generation Complete
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Audio narration and video presentation have been successfully created.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Voice Cloning Toggle */}
          <div className={`flex items-center gap-3 p-4 rounded-lg border
                          ${useVoiceCloning ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}
                          ${mediaGenerated ? 'opacity-50' : ''}`}>
            <input
              type="checkbox"
              id="useVoiceCloning"
              checked={useVoiceCloning}
              onChange={(e) => setUseVoiceCloning(e.target.checked)}
              disabled={mediaGenerated}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label htmlFor="useVoiceCloning" className="flex-1 cursor-pointer">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Use Voice Cloning 
                <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
                  FREE
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Clone any voice from an audio sample • Powered by Coqui TTS (local processing)
              </div>
            </label>
          </div>

          {/* Voice Sample Upload - shown when voice cloning is enabled */}
          {useVoiceCloning && (
            <div className={mediaGenerated ? 'opacity-50' : ''}>
              <VoiceSampleUpload
                onFileSelect={handleVoiceSampleSelect}
                selectedFile={voiceSampleFile}
                onRemove={handleRemoveVoiceSample}
                disabled={mediaGenerated || uploadingVoice}
              />
            </div>
          )}

          {/* settings grid - disabled when media is generated or voice cloning is enabled */}
          {!useVoiceCloning && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${mediaGenerated ? 'opacity-50' : ''}`}>
              {/* Only show VoiceSelector for selected language */}
              <VoiceSelector
                language={selectedLanguage}
                value={voiceSelections[selectedLanguage]}
                onChange={changeVoice}
              />

              {/* language picker */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={e => setSelectedLang(e.target.value)}
                  disabled={mediaGenerated}
                  className="w-full px-3 py-2 border rounded-md
                             bg-white dark:bg-gray-900
                             border-gray-300 dark:border-gray-600
                             text-gray-900 dark:text-gray-100
                             focus:outline-none focus:ring-2 focus:ring-gray-700
                             disabled:opacity-50 disabled:cursor-not-allowed">
                  {SUPPORTED_LANGUAGES.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Language picker for voice cloning mode */}
          {useVoiceCloning && (
            <div className={`space-y-2 ${mediaGenerated ? 'opacity-50' : ''}`}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLang(e.target.value)}
                disabled={mediaGenerated}
                className="w-full px-3 py-2 border rounded-md
                           bg-white dark:bg-gray-900
                           border-gray-300 dark:border-gray-600
                           text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-gray-700
                           disabled:opacity-50 disabled:cursor-not-allowed">
                {SUPPORTED_LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          )}

          {/* Action buttons */}
          {!mediaGenerated ? (
            /* Generate button - shown when media not generated */
            <button
              onClick={generateAudio}
              disabled={audioLoading || videoLoading || uploadingVoice || (useVoiceCloning && !voiceSampleUploaded)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3
                         rounded-md bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400
                         text-white font-medium transition-colors duration-150">
              {(audioLoading || videoLoading) ? (
                <>
                  <LoadingSpinner size="sm" />
                  {audioLoading ? 'Generating audio…' : 'Building video…'}
                </>
              ) : uploadingVoice ? (
                <>
                  <LoadingSpinner size="sm" />
                  Uploading voice sample…
                </>
              ) : (
                <>
                  <FiMic className="w-5 h-5" />
                  Generate Audio & Video
                </>
              )}
            </button>
          ) : (
            /* Results button - shown when media is generated */
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={goToResults}
                className="flex-1 flex items-center justify-center gap-2 
                           px-4 sm:px-6 py-3 sm:py-3
                           rounded-md bg-gray-900 hover:bg-gray-700 
                           text-white font-medium transition-colors duration-150
                           text-sm sm:text-base min-h-[44px] w-full sm:w-auto
                           touch-manipulation">
                <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">View Results</span>
              </button>
            </div>

          )}

          {/* Media status indicators */}
          {(hasAudioFiles || hasVideoPath) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className={`flex items-center gap-2 text-sm ${hasAudioFiles ? 'text-gray-600 dark:text-gray-400' : 'text-neutral-400'}`}>
                <FiMic className="w-4 h-4" />
                <span>Audio: {hasAudioFiles ? 'Generated' : 'Pending'}</span>
              </div>
              <div className={`flex items-center gap-2 text-sm ${hasVideoPath ? 'text-gray-600 dark:text-gray-400' : 'text-neutral-400'}`}>
                <FiVideo className="w-4 h-4" />
                <span>Video: {hasVideoPath ? 'Generated' : 'Pending'}</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default MediaGeneration;