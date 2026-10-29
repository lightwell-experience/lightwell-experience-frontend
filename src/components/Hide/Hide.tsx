interface Props {
  hide: boolean;
  children?: React.ReactNode;
}

const Hide = ({ hide, children }: Props) => (hide ? <></> : <>{children}</>);

export default Hide;
