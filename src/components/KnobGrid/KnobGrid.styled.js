import styled from 'styled-components';

export const ComponentContainer = styled.div.withConfig({
    shouldForwardProp: (prop) => !['columns', 'rows', 'gap'].includes(prop),
})`
    display: grid;
    position: relative;
    grid-template-rows: ${({ rows }) => `repeat(${rows}, 1fr)`};
    grid-template-columns: ${({ columns }) => `repeat(${columns}, 1fr)`};
    gap: ${({ gap }) => gap};
    align-items: center;
    justify-items: center;
`;
