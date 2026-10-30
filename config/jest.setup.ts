import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-ouia-component-id' });

jest.mock('Hooks/useDebounce', () => (value) => value);
