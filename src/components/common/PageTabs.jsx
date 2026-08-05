import { Tabs, Tab } from '@mui/material';

const PageTabs = ({ value, onChange, tabs, sx }) => (
  <Tabs value={value} onChange={onChange} sx={sx}>
    {tabs.map((tab) => (
      <Tab key={tab.label} label={tab.label} disabled={tab.disabled} />
    ))}
  </Tabs>
);

export default PageTabs;