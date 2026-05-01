interface RequesterPlaceholderProps {
  icon: string;
  title: string;
  message: string;
}

export const RequesterPlaceholder = ({
  icon,
  title,
  message
}: RequesterPlaceholderProps): React.JSX.Element => (
  <main className="placeholder-app" aria-label="Requester">
    <section className="placeholder-app-content">
      <span className="material-icons-round placeholder-app-icon" aria-hidden="true">
        {icon}
      </span>
      <h1>{title}</h1>
      <p>{message}</p>
    </section>
  </main>
);
