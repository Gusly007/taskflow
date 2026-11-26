// Joins class names and drops the falsy ones: cn('btn', isActive && 'btn-active').
export const cn = (...classes: Array<string | false | null | undefined>): string => classes.filter(Boolean).join(' ');
