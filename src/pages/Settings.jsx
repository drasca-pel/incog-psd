export default function Settings() {
  return (
    <div style={styles.page}>
      <h2>Settings</h2>
      
      <section style={styles.section}>
        <h3>Account</h3>
        <button>Edit Profile</button>
        <button>Change Password</button>
      </section>

      <section style={styles.section}>
        <h3>Preferences</h3>
        <button>Update Skills</button>
        <label>
          <input type="checkbox" /> Enable Notifications
        </label>
      </section>

      <button style={styles.logoutBtn} onClick={() => auth.signOut()}>
        Log Out
      </button>

      <BottomNav />
    </div>
  );
}