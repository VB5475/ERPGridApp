// utils/dateUtils.js
export const getDateRange = (type, customStart, customEnd) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ranges = {
        today: () => ({ start: today, end: new Date() }),
        yesterday: () => {
            const start = new Date(today);
            start.setDate(today.getDate() - 1);
            return { start, end: new Date(start.getTime() + 86400000 - 1) };
        },
        past_week: () => {
            const now = new Date();
            const currentWeekDay = now.getDay();
            const mondayThisWeek = new Date(now);
            mondayThisWeek.setDate(now.getDate() - ((currentWeekDay + 6) % 7));

            const start = new Date(mondayThisWeek);
            start.setDate(start.getDate() - 7);
            const end = new Date(mondayThisWeek);
            end.setDate(end.getDate() - 1);

            return { start, end };
        },
        past_month: () => {
            const year = today.getFullYear();
            const month = today.getMonth();
            return {
                start: new Date(year, month - 1, 1),
                end: new Date(year, month, 0)
            };
        },
        past_6_months: () => {
            const year = today.getFullYear();
            const month = today.getMonth();
            return {
                start: new Date(year, month - 6, 1),
                end: new Date(year, month, 0)
            };
        },
        past_year: () => {
            const year = today.getFullYear();
            return {
                start: new Date(year - 1, 0, 1),
                end: new Date(year - 1, 11, 31)
            };
        },
        custom: () => {
            if (!customStart || !customEnd) return null;
            return {
                start: new Date(customStart),
                end: new Date(customEnd + 'T23:59:59')
            };
        }
    };

    return ranges[type]?.() || null;
};
