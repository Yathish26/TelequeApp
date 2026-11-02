// Same wording as hafrontend/src/TelegramDashboard.jsx — keep in sync.
export function formatInterval(minutes) {
    if (minutes === 0) return 'Instant (as soon as you send)';
    if (minutes < 1) return `Every ${minutes * 60} seconds`;
    if (minutes === 1) return 'Every minute';
    if (minutes === 1440) return 'Once a day';
    if (minutes % 60 === 0) return minutes === 60 ? 'Every hour' : `Every ${minutes / 60} hours`;
    return `Every ${minutes} minutes`;
}

export const formatDateTime = (value) => new Date(value).toLocaleString([], {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
});
