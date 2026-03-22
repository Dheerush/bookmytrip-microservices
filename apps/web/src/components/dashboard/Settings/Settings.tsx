"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  KeyRound,
  LogOut,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/services/auth/context";
import { showToast } from "@/lib/toast";
import styles from "./Settings.module.scss";

type SettingsTab = "profile" | "password";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<SettingsTab>("profile");

  // Profile state
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would call an API
    setProfileSaved(true);
    showToast.success("Profile updated successfully!");
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      showToast.error("Password must be at least 8 characters");
      return;
    }
    // In production, this would call an API
    setPasswordSaved(true);
    showToast.success("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your profile, password, and account preferences</p>
      </div>

      {/* Tab bar */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "profile" ? styles.active : ""}`}
          onClick={() => setTab("profile")}
        >
          <User size={14} strokeWidth={1.6} />
          Edit Profile
        </button>
        <button
          className={`${styles.tab} ${tab === "password" ? styles.active : ""}`}
          onClick={() => setTab("password")}
        >
          <KeyRound size={14} strokeWidth={1.6} />
          Change Password
        </button>
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <motion.form
          className={styles.form}
          onSubmit={handleProfileSave}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.avatarSection}>
            <div className={styles.avatarLarge}>
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={fullName} className={styles.avatarImg} /> // eslint-disable-line @next/next/no-img-element
              ) : (
                <span className={styles.avatarInitial}>
                  {(fullName || email)[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className={styles.avatarInfo}>
              <span className={styles.avatarName}>{fullName || email}</span>
              <span className={styles.avatarRole}>{user?.role || "user"}</span>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <input
                className={styles.input}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                maxLength={100}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                className={`${styles.input} ${styles.disabled}`}
                type="email"
                value={email}
                disabled
              />
              <span className={styles.hint}>Email cannot be changed</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Phone Number</label>
            <input
              className={styles.input}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              maxLength={15}
            />
          </div>

          <motion.button
            type="submit"
            className={styles.saveBtn}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {profileSaved ? <CheckCircle2 size={14} strokeWidth={1.6} /> : <Save size={14} strokeWidth={1.6} />}
            {profileSaved ? "Saved!" : "Save Changes"}
          </motion.button>
        </motion.form>
      )}

      {/* Password Tab */}
      {tab === "password" && (
        <motion.form
          className={styles.form}
          onSubmit={handlePasswordChange}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.field}>
            <label className={styles.label}>Current Password</label>
            <div className={styles.passwordWrapper}>
              <input
                className={styles.input}
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowCurrent((p) => !p)}
              >
                {showCurrent ? <EyeOff size={16} strokeWidth={1.4} /> : <Eye size={16} strokeWidth={1.4} />}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>New Password</label>
            <div className={styles.passwordWrapper}>
              <input
                className={styles.input}
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowNew((p) => !p)}
              >
                {showNew ? <EyeOff size={16} strokeWidth={1.4} /> : <Eye size={16} strokeWidth={1.4} />}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Confirm New Password</label>
            <input
              className={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              minLength={8}
            />
          </div>

          <motion.button
            type="submit"
            className={styles.saveBtn}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {passwordSaved ? <CheckCircle2 size={14} strokeWidth={1.6} /> : <KeyRound size={14} strokeWidth={1.6} />}
            {passwordSaved ? "Password Changed!" : "Change Password"}
          </motion.button>
        </motion.form>
      )}

      {/* Danger Zone */}
      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>Account</h3>
        <motion.button
          className={styles.logoutBtn}
          onClick={handleLogout}
          whileHover={{ x: 2 }}
        >
          <LogOut size={16} strokeWidth={1.6} />
          Log Out
        </motion.button>
      </div>
    </div>
  );
}
