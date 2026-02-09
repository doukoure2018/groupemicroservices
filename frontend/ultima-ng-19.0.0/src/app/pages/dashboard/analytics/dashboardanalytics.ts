import { Component } from '@angular/core';
import { MonthlyComparisonWidget } from '@/pages/dashboard/analytics/components/monthlycomparisonwidget';
import { InsightsWidget } from '@/pages/dashboard/analytics/components/insightswidget';
import { StatsWidget } from '@/pages/dashboard/analytics/components/statswidget';
import { StoresWidget } from '@/pages/dashboard/analytics/components/storeswidget';
import { TopSearchesWidget } from '@/pages/dashboard/analytics/components/topsearcheswidget';
import { AnalyticsTableWidget } from '@/pages/dashboard/analytics/components/analyticstablewidget';
import { ExpensesWidget } from '@/pages/dashboard/analytics/components/expenseswidget';
import { RatingsWidget } from '@/pages/dashboard/analytics/components/ratingswidget';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-dashboard-analytics',
    standalone: true,
    imports: [MonthlyComparisonWidget, InsightsWidget, StatsWidget, StoresWidget, TopSearchesWidget, AnalyticsTableWidget, ExpensesWidget, RatingsWidget, ProgressSpinnerModule],
    templateUrl: './analytic.component.html',
    providers: [MessageService]
})
export class DashboardAnalytics {}
