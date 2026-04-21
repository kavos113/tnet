let projectRoot = '';

export const setProjectRoot = (root: string): void => {
  projectRoot = root ? root.replace(/\\/g, '/') : '';
};

export const getProjectRoot = (): string => projectRoot;
