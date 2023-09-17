import React, { useEffect, useState } from 'react'
import {
    Button,
    Paper,
    Badge,
    Box,
    Divider,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    Stack,
} from '@mui/material'
import iconPNG from '../assets/icon.png'
import { Trans, useTranslation } from 'react-i18next'
import * as runtime from '../packages/runtime'
import * as remote from '../packages/remote'
import { Settings, SponsorAboutBanner, UsageData } from '../stores/types'

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface Props {
    open: boolean
    usageData: UsageData
    close(): void
}

export default function UsageDialog(props: Props) {
    const { t } = useTranslation()
    const usageData = props.usageData
    const options = {
        responsive: true,
        plugins: {
          title: {
            display: false,
            text: 'Usage in last 30 days ($)',
          },
          legend: {
            display: false,
          },
        },
    };
    const data = {
        labels: usageData.date_list,
        backgroundColor: 'rgba(53, 162, 235, 1.0)',
        datasets: [
          {
            label: 'Dollars',
            data: usageData.usage_list,
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
        ],
    };
    return (
        <Dialog open={props.open} onClose={props.close} fullWidth>
            <DialogTitle>{t('Usage')}</DialogTitle>
            <DialogContent>
                <Box sx={{ textAlign: 'center', padding: '0 20px' }}>
                    <h3>Usage in last 30 days ($)</h3>
                    <Bar
                        data={data}
                        options={options}
                    />
                    <p>User Name {usageData.user_name}</p>
                    <p>User SK {usageData.user_sk}</p>
                    <p>Quota Monthly {usageData.quota_monthly}</p>
                    <p>Total Usage {usageData.usage}</p>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.close}>{t('close')}</Button>
            </DialogActions>
        </Dialog>
    )
}
