import NepaliDate from 'nepali-date-converter';

const pad = (value) => String(value).padStart(2, '0');

const toAdString = ({ year, month, date }) =>
    `${year}-${pad(month + 1)}-${pad(date)}`;

const toBsString = ({ year, month, date }) =>
    `${year}/${pad(month + 1)}/${pad(date)}`;

export const adToBsString = (value = new Date()) => {
    const jsDate = value instanceof Date ? value : new Date(value);
    const bs = new NepaliDate(jsDate).getBS();
    return toBsString(bs);
};

export const bsStringToAdString = (bsDateString) => {
    if (!bsDateString) {
        return null;
    }
    const bsDate = new NepaliDate(bsDateString);
    return toAdString(bsDate.getAD());
};

export const getBsTodayString = () => {
    const today = new NepaliDate();
    return toBsString(today.getBS());
};

export const getBsTomorrowString = () => {
    const tomorrow = new NepaliDate();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toBsString(tomorrow.getBS());
};

export const getBsMonthDateRange = (bsYear, bsMonth) => {
    const year = parseInt(bsYear, 10);
    const monthIndex = parseInt(bsMonth, 10) - 1;
    if (Number.isNaN(year) || Number.isNaN(monthIndex)) {
        throw new Error('Invalid BS year or month');
    }

    const startBs = new NepaliDate(year, monthIndex, 1);
    const endBs = new NepaliDate(year, monthIndex, 1);
    endBs.setMonth(endBs.getMonth() + 1);
    endBs.setDate(0); // Move back one day to get end of month

    return {
        start: toAdString(startBs.getAD()),
        end: toAdString(endBs.getAD()),
    };
};

export const getDaysInBsMonth = (bsYear, bsMonth) => {
    const year = parseInt(bsYear, 10);
    const monthIndex = parseInt(bsMonth, 10) - 1;
    if (Number.isNaN(year) || Number.isNaN(monthIndex)) {
        return 30;
    }
    const cursor = new NepaliDate(year, monthIndex, 1);
    cursor.setMonth(cursor.getMonth() + 1);
    cursor.setDate(0);
    return cursor.getDate();
};

export const formatBsDateParts = ({ year, month, date }) => toBsString({ year, month, date });

