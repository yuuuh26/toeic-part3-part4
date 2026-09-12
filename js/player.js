import {localURL} from './question-loader.js';
export class Player{
 constructor(){this.audio=new Audio();this.audio.preload='auto';this.audio.preservesPitch=true;this.preloads=[];this.generation=0;this.rate=1;}
 load(path,autoplay){this.generation++;const g=this.generation;this.audio.pause();this.audio.src=localURL(path);this.audio.playbackRate=this.rate;this.audio.load();if(autoplay)this.play(g);}
 async play(g=this.generation){try{await this.audio.play();if(g===this.generation)this.message?.('');}catch(e){if(g!==this.generation||e.name==='AbortError')return;this.message?.(e.name==='NotAllowedError'?'「再生」をタップすると音声が始まります。':'音声を再生できません。MP3の配置・保存状況を確認してください。');}}
 toggle(){this.audio.paused?this.play():this.audio.pause();}
 speed(rate){this.rate=rate;this.audio.playbackRate=rate;}
 preload(sets){for(const a of this.preloads){a.pause();a.removeAttribute('src');a.load();}this.preloads=sets.slice(0,2).map(s=>{const a=new Audio();a.preload='auto';a.src=localURL(s.audio);a.load();return a;});}
 stop(){this.generation++;this.audio.pause();this.audio.removeAttribute('src');this.audio.load();this.preload([]);}
}
