const overlap = 2;

const bgmSetting = {
	tj: {
		offset: 0,
		bpm: 108,
		loop: true,
		start: 60985 / 44100,
		end: 2413069 / 44100,
	}
};

const Data = {
	m_main_menu: {
		offset: 0.424,
		bpm: 60,
	},
	m_first: {
		offset: 0,
		bpm: 140,
		loop: true,
		start: 0 + overlap,
		end: 760286 / 48000 + overlap,
	},
	m_tj_drum: bgmSetting.tj,
	m_tj_base: bgmSetting.tj,
	m_tj_jump: bgmSetting.tj,
	m_tj_idle: bgmSetting.tj,
	m_tj_full: bgmSetting.tj,
	m_tj_shop: bgmSetting.tj,
	m_transition: bgmSetting.tj,
};

export type MusicKey = keyof typeof Data;
export type MusicDataType = {
	[K in MusicKey]: {
		offset: number;
		bpm: number;
		loop: boolean;
		start: number;
		end: number;
	};
};

export default Data as MusicDataType;
