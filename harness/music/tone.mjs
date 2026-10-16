// Pitch formula and first-note timing come from Blips SoundParams.swift and jingle parts.
// Only the uncontaminated start of a stable pitched sound is used; never synthesize new params.
export function toneInfo(sound){
 const parts=sound.parts;
 const first=parts?.[0];
 if(parts&&(!first||first.start!==0||first.sound||parts.slice(1).some(p=>!Number.isFinite(p.start)||p.start<=0)))return null;
 const params=parts?first.params:sound.params;
 if(!params||![0,1,2].includes(params.wave_type))return null;
 for(const key of ['p_freq_ramp','p_freq_dramp','p_arp_mod','p_repeat_speed','p_vib_strength','p_duty_ramp','p_lpf_ramp','p_hpf_ramp'])if(params[key]!==0)return null;
 if(!Number.isFinite(params.p_base_freq)||params.p_base_freq<=0)return null;
 const seconds=Math.min(sound.duration,parts?first.duration:0.25,...(parts?.slice(1).map(p=>p.start)||[]))-0.001;
 const rootMidi=69+12*Math.log2(3528*(params.p_base_freq**2+0.001)/440);
 if(!Number.isFinite(seconds)||seconds<0.04||!Number.isFinite(rootMidi))return null;
 return {rootMidi,cropSeconds:Math.min(seconds,0.5)};
}
