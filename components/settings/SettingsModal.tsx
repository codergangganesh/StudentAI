'use client';

import React, { useEffect, useState } from 'react';
import { RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useSettingsStore, AppTheme, FontSize } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';
import Modal from '@/components/ui/Modal';
import styles from './SettingsModal.module.css';

export default function SettingsModal() {
  const { 
    theme, setTheme, 
    model, setModel, 
    temperature, setTemperature, 
    fontSize, setFontSize,
    loadSettings 
  } = useSettingsStore();

  const { settingsModalOpen, setSettingsModalOpen, addToast } = useUIStore();
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setTheme('system');
      setModel('llama-3.3-70b-versatile');
      setTemperature(0.7);
      setFontSize('md');
      setDevMode(false);
      addToast('Settings reset successfully', 'success');
    }
  };

  return (
    <Modal
      isOpen={settingsModalOpen}
      onClose={() => setSettingsModalOpen(false)}
      title="Application Settings"
    >
      <div className={styles.container}>
        {/* Visual Settings Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Preferences</h4>
          
          {/* Theme */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Color Theme</span>
              <span className={styles.settingDesc}>Customize the visual theme of the application.</span>
            </div>
            <select
              className={styles.select}
              value={theme}
              onChange={(e) => setTheme(e.target.value as AppTheme)}
            >
              <option value="system">System Default</option>
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>

          {/* Font Size */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Text Font Size</span>
              <span className={styles.settingDesc}>Adjust the readability size of messages.</span>
            </div>
            <select
              className={styles.select}
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value as FontSize)}
            >
              <option value="sm">Small</option>
              <option value="md">Normal</option>
              <option value="lg">Large</option>
            </select>
          </div>
        </div>

        {/* AI Configurations Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Model parameters</h4>

          {/* Model */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Grok Model Choice</span>
              <span className={styles.settingDesc}>Select the active intelligence provider.</span>
            </div>
            <select
              className={styles.select}
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Versatile)</option>
              <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fast)</option>
              <option value="llama-3.2-11b-vision-preview">Llama 3.2 11B (Vision)</option>
            </select>
          </div>

          {/* Temperature */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Sampling Temperature</span>
              <span className={styles.settingDesc}>Higher values yield more random/creative answers.</span>
            </div>
            <div className={styles.sliderWrapper}>
              <input
                type="range"
                className={styles.slider}
                min="0.1"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
              <span className={styles.sliderValue}>{temperature}</span>
            </div>
          </div>
        </div>

        {/* Experimental Developer settings */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Advanced Settings</h4>

          {/* Developer Mode */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Developer Mode</span>
              <span className={styles.settingDesc}>Enable experimental vision and analysis triggers.</span>
            </div>
            <label className={styles.switch}>
              <input 
                type="checkbox" 
                checked={devMode}
                onChange={(e) => {
                  setDevMode(e.target.checked);
                  addToast(e.target.checked ? 'Developer mode enabled' : 'Developer mode disabled', 'info');
                }}
              />
              <span className={styles.sliderRound}></span>
            </label>
          </div>
        </div>

        {/* Reset settings button */}
        <button className={styles.resetBtn} onClick={handleReset}>
          <RotateCcw size={16} />
          <span>Reset Settings to Defaults</span>
        </button>
      </div>
    </Modal>
  );
}
