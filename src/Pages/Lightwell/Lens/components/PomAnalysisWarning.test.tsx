import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GeneratePomSbomPopover from './PomAnalysisWarning';

describe('GeneratePomSbomPopover', () => {
  it('explains how to generate an SBOM', async () => {
    render(<GeneratePomSbomPopover />);

    expect(
      screen.queryByRole('heading', { name: 'Generate an SBOM from pom.xml' }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'How to generate an SBOM' }));

    expect(
      await screen.findByRole('heading', { name: 'Generate an SBOM from pom.xml' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('mvn org.cyclonedx:cyclonedx-maven-plugin:2.9.1:makeAggregateBom'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show content' })).not.toBeInTheDocument();
    expect(screen.getByText(/target\/bom\.json/)).toBeInTheDocument();
  });
});
